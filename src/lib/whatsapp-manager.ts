import makeWASocket, { 
  useMultiFileAuthState, 
  DisconnectReason, 
  fetchLatestBaileysVersion, 
  makeCacheableSignalKeyStore,
  WAMessage,
  Browsers
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import path from "path";
import fs from "fs";
import { Server } from "socket.io";
import QRCode from "qrcode";
import { commands, CommandContext } from "./commands.ts";

const logger = pino({ level: "silent" });

export class WhatsAppManager {
  private sessions: Map<string, any> = new Map();
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    this.loadExistingSessions();
  }

  private async loadExistingSessions() {
    const sessionsDir = path.join(process.cwd(), "sessions");
    if (!fs.existsSync(sessionsDir)) {
      fs.mkdirSync(sessionsDir);
      return;
    }

    const sessionFolders = fs.readdirSync(sessionsDir);
    for (const folder of sessionFolders) {
      if (fs.lstatSync(path.join(sessionsDir, folder)).isDirectory()) {
        this.createSession(folder);
      }
    }
  }

  public async createSession(sessionId: string, phoneNumber?: string) {
    // If session exists and is connected, don't recreate
    if (this.sessions.has(sessionId) && this.sessions.get(sessionId).status === "connected") return;

    const sessionDir = path.join(process.cwd(), "sessions", sessionId);
    
    // Ensure clean start for pairing if requested
    if (phoneNumber && fs.existsSync(sessionDir)) {
      console.log(`[${sessionId}] Cleaning session directory for fresh pairing`);
      fs.rmSync(sessionDir, { recursive: true, force: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      printQRInTerminal: false,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      logger,
      // Critical: Use a standard browser string for pairing codes
      browser: Browsers.ubuntu("Chrome"),
      syncFullHistory: false,
      markOnlineOnConnect: true,
    });

    this.sessions.set(sessionId, { sock, status: "connecting" });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr && !phoneNumber) {
        try {
          const qrDataURL = await QRCode.toDataURL(qr);
          this.io.emit(`qr:${sessionId}`, qrDataURL);
        } catch (e) {
          console.error("QR Generation Error:", e);
        }
      }

      if (connection === "close") {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        
        console.log(`[${sessionId}] Connection closed: ${statusCode}. Reconnecting: ${shouldReconnect}`);
        
        this.sessions.set(sessionId, { ...this.sessions.get(sessionId), status: "disconnected" });
        this.io.emit(`status:${sessionId}`, "disconnected");
        
        if (shouldReconnect) {
          setTimeout(() => this.createSession(sessionId), 5000);
        }
      } else if (connection === "open") {
        this.sessions.set(sessionId, { sock, status: "connected" });
        this.io.emit(`status:${sessionId}`, "connected");
        console.log(`[${sessionId}] Connected successfully`);
      }
    });

    sock.ev.on("messages.upsert", async (m) => {
      if (m.type === "notify") {
        for (const msg of m.messages) {
          if (!msg.key.fromMe && msg.message) {
            // Anti-ban: Add a small random delay before processing
            const delay = Math.floor(Math.random() * 1500) + 500;
            setTimeout(async () => {
              await this.processCommand(sessionId, sock, msg);
            }, delay);
          }
        }
      }
    });

    // Handle Pairing Code
    if (phoneNumber && !sock.authState.creds.registered) {
      // Sanitize phone number: remove all non-digits
      const sanitizedNumber = phoneNumber.replace(/\D/g, "");
      
      console.log(`[${sessionId}] Requesting pairing code for: ${sanitizedNumber}`);
      
      // Wait for socket to be ready
      setTimeout(async () => {
        try {
          const code = await sock.requestPairingCode(sanitizedNumber);
          console.log(`[${sessionId}] Pairing code generated: ${code}`);
          this.io.emit(`pairing-code:${sessionId}`, code);
        } catch (err) {
          console.error(`[${sessionId}] Pairing code error:`, err);
          this.io.emit(`error:${sessionId}`, "Failed to generate pairing code. Please try again.");
        }
      }, 5000); // Increased delay to ensure socket readiness
    }

    return sock;
  }

  private async processCommand(sessionId: string, sock: any, msg: WAMessage) {
    const body = msg.message?.conversation || 
                 msg.message?.extendedTextMessage?.text || 
                 msg.message?.imageMessage?.caption || 
                 msg.message?.videoMessage?.caption || "";
    
    const prefixes = ["!", ".", "/"];
    const prefix = prefixes.find(p => body.startsWith(p));
    if (!prefix) return;

    const args = body.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();
    if (!commandName) return;

    const from = msg.key.remoteJid!;
    const isGroup = from.endsWith("@g.us");
    const sender = msg.key.participant || msg.key.remoteJid!;

    const ctx: CommandContext = {
      sock,
      msg,
      args,
      from,
      isGroup,
      sender,
      sessionId
    };

    if (commands[commandName]) {
      try {
        await commands[commandName](ctx);
      } catch (err) {
        console.error(`Error in command ${commandName}:`, err);
        await sock.sendMessage(from, { text: "⚠️ Command Error: " + (err as Error).message });
      }
    }
  }

  public getSessions() {
    const sessionList: any[] = [];
    this.sessions.forEach((val, key) => {
      sessionList.push({ id: key, status: val.status });
    });
    return sessionList;
  }

  public async deleteSession(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (session?.sock) {
      try {
        await session.sock.logout();
      } catch (e) {}
    }
    this.sessions.delete(sessionId);
    const sessionDir = path.join(process.cwd(), "sessions", sessionId);
    if (fs.existsSync(sessionDir)) {
      fs.rmSync(sessionDir, { recursive: true, force: true });
    }
    this.io.emit(`status:${sessionId}`, "deleted");
  }
}

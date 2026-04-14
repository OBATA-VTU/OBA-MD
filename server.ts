import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { WhatsAppManager } from "./src/lib/whatsapp-manager.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  const PORT = 3000;

  // Initialize WhatsApp Manager
  const waManager = new WhatsAppManager(io);

  app.use(express.json());

  // API Routes
  app.get("/api/sessions", (req, res) => {
    res.json(waManager.getSessions());
  });

  app.post("/api/sessions/create", async (req, res) => {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: "Session ID required" });
    
    try {
      await waManager.createSession(sessionId);
      res.json({ message: "Session creation started" });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post("/api/sessions/delete", async (req, res) => {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: "Session ID required" });
    
    try {
      await waManager.deleteSession(sessionId);
      res.json({ message: "Session deleted" });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post("/api/sessions/pairing-code", async (req, res) => {
    const { sessionId, phoneNumber } = req.body;
    if (!sessionId || !phoneNumber) return res.status(400).json({ error: "Session ID and Phone Number required" });
    
    try {
      // Delete existing session if it's not connected to ensure fresh pairing
      const existing = waManager.getSessions().find(s => s.id === sessionId);
      if (existing && existing.status !== "connected") {
        await waManager.deleteSession(sessionId);
      }
      
      await waManager.createSession(sessionId, phoneNumber);
      res.json({ message: "Pairing code requested" });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);

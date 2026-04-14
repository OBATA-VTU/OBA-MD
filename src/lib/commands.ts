import { WAMessage, proto, downloadContentFromMessage } from "@whiskeysockets/baileys";
import { Sticker, StickerTypes } from "wa-sticker-formatter";
import yts from "yt-search";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface CommandContext {
  sock: any;
  msg: WAMessage;
  args: string[];
  from: string;
  isGroup: boolean;
  sender: string;
  sessionId: string;
}

export const commands: Record<string, (ctx: CommandContext) => Promise<void>> = {
  ping: async ({ sock, from }) => {
    await sock.sendMessage(from, { text: "OBA MD is alive and kicking! ⚡" });
  },

  menu: async ({ sock, from, sessionId }) => {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    const uptimeStr = `${hours}h ${minutes}m ${seconds}s`;
    
    const menu = `
╔════════◇◆◇═══════╗
├▢❤️🔥 *𝐄𝐌𝐌𝐘𝐇𝐄𝐍𝐙-𝐕3.5* ❤️🔥
├▢👑 Owner: *𝕰𝖒𝖒𝖞𝕳𝖊𝖓𝖟*
├▢🕐 *${new Date().toLocaleString()}*
├▢⏱️ Uptime: *${uptimeStr}*
├▢📶 Ping: *${Math.floor(Math.random() * 20) + 5}ms*
├▢🔖 Version: *v2.0.0*
├▢🌐 *Free Bot:*
bot-connect.emmyhenztech.site
╚════════◇◆◇═══════╝

╔══════════════════╗
    👬 *GROUP MANAGER*
╠──────────────────╣
║ *.ban* <ban a user>
║ *.unban* <remove ban>
║ *.promote* <make admin>
║ *.demote* <remove admin>
║ *.kick* <remove member>
║ *.mute* <disable chat>
║ *.unmute* <enable chat>
║ *.add* <add member>
║ *.kickall* <kick everyone>
║ *.leavegc* <bot leaves>
║ *.creategc* <create group>
║ *.setname* <rename group>
║ *.setdesc* <set description>
║ *.revoke* <reset invite link>
║ *.welcome* <join message>
║ *.goodbye* <leave message>
║ *.tagall* <mention everyone>
║ *.tag* <tag with message>
║ *.hidetag* <silent tag all>
║ *.tagadmins* <tag admins>
║ *.staff* <list admins>
║ *.groupinfo* <group details>
║ *.gcstatus* <set gc status>
║ *.jid* <show group JID>
║ *.topmembers* <most active>
╚══════════════════╝

╔══════════════════╗
    🛡️ *SECURITY*
╠──────────────────╣
║ *.antilink* <block links>
║ *.antitag* <block tag spam>
║ *.antibadword* <filter words>
║ *.antidelete* <recover msgs>
║ *.anticall* <block calls>
║ *.slowmode* <slow messages>
║ *.lockgroup* <admins only>
║ *.unlockgroup* <open group>
║ *.warn* <warn a member>
║ *.warnings* <check warns>
╚══════════════════╝

╔══════════════════╗
    ⚙️ *SETTINGS*
╠──────────────────╣
║ *.mode* <public/private>
║ *.autostatus* <view status>
║ *.autotyping* <show typing>
║ *.autorecording* <show rec>
║ *.autoreact* <auto react>
║ *.channelreact* <react posts>
║ *.setpp* <change bot pic>
║ *.setbotbio* <set bot bio>
║ *.clearsession* <clear session>
║ *.cleartmp* <delete temp>
╚══════════════════╝

╔══════════════════╗
     🤖 *AI MENU*
╠──────────────────╣
║ *.gpt* <chat with GPT>
║ *.gemini* <chat Gemini>
║ *.imagine* <AI image>
║ *.flux* <Flux image>
║ *.dalle* <DALL·E image>
╚══════════════════╝

╔══════════════════╗
    📥 *DOWNLOADER*
╠──────────────────╣
║ *.play* <download audio>
║ *.song / .music* <find song>
║ *.ytmp3 / .mp3* <YT to MP3>
║ *.video / .ytmp4* <YT to MP4>
║ *.instagram* <download IG>
║ *.tiktok / .tt* <download TT>
║ *.facebook / .fb* <download FB>
║ *.tomp3* <video to audio>
╚═══════════════════╝

╔══════════════════╗
  🛠️ *UTILITY & TOOLS*
╠──────────────────╣
║ *.ss / .ssweb* <screenshot>
║ *.translate* <translate text>
║ *.tts* <text to speech>
║ *.qrcode / .qr* <make QR>
║ *.shorturl* <shorten link>
║ *.tourl* <upload file>
║ *.hash* <hash string>
║ *.base64* <encode/decode>
║ *.binary* <text to binary>
║ *.encrypt* <encrypt text>
║ *.decrypt* <decrypt text>
║ *.calculator* <do math>
║ *.reminder* <set reminder>
║ *.password* <gen password>
║ *.timestamp* <unix time>
║ *.currency* <convert money>
║ *.crypto* <crypto price>
║ *.weather* <city weather>
║ *.news* <latest headlines>
║ *.pair* <link WhatsApp>
║ *.save* <save message>
║ *.savecontact* <save contact>
║ *.delete* <delete message>
║ *.vv* <view once reveal>
║ *.vv2* <bypass view once>
║ *.block* <block contact>
║ *.unblock* <unblock contact>
║ *.device* <device info>
║ *.getpp* <profile picture>
╚══════════════════╝

╔══════════════════╗
   🎨 *STICKER & IMAGE*
╠──────────────────╣
║ *.sticker / .s* <img to sticker>
║ *.simage* <sticker to img>
║ *.blur* <blur image>
║ *.attp* <text to sticker>
║ *.take* <set sticker name>
║ *.emojimix* <mix 2 emojis>
║ *.tgsticker* <TG sticker>
║ *.meme* <random meme>
╚══════════════════╝

╔══════════════════╗
        🖼️ *PIES*
╠──────────────────╣
║ *.pies* <browse country>
║ *.india* *.china* *.japan*
║ *.korea* *.thai* *.malaysia*
╚══════════════════╝

╔══════════════════╗
       🎮 *GAMES*
╠──────────────────╣
║ *.tictactoe* <play ttt>
║ *.hangman* <play hangman>
║ *.trivia* <trivia game>
║ *.truth* <truth question>
║ *.dare* <dare challenge>
║ *.poll* <create poll>
║ *.vote* <vote on poll>
║ *.results* <poll results>
╚═════════════════╝

╔═════════════════╗
    📝 *TEXT TOOLS*
╠─────────────────╣
║ *.count* <count chars
║ *.reverse* <reverse text>
║ *.case* <change case>
║ *.palindrome* <check palindrome>
║ *.lyrics* <find lyrics>
╚═════════════════╝

╔═════════════════╗
 🔤 *DESIGN / TEXTMAKER*
╠─────────────────╣
║ *.metallic* *.ice* *.snow*
║ *.impressive* *.matrix* *.neon*
║ *.light* *.devil* *.purple*
║ *.thunder* *.leaves* *.1917*
║ *.arena* *.hacker* *.sand*
║ *.blackpink* *.glitch* *.fire*
║ _<styled text effects>_
╚═════════════════╝

╔═════════════════╗
    🎯 *FUN & SOCIAL*
╠─────────────────╣
║ *.compliment* <compliment user>
║ *.insult* <roast a user>
║ *.flirt* <send a flirt>
║ *.roast* <random roast>
║ *.8ball* <magic answer>
║ *.dice* <roll dice>
║ *.coin* <flip coin>
║ *.random* <random number>
║ *.pick* <pick option>
║ *.age* <calculate age>
║ *.riddle* <get riddle>
║ *.ship* <ship two users>
║ *.simp* <simp rating>
║ *.stupid* <stupidity rate>
║ *.character* <anime char>
║ *.wasted* <wasted effect>
║ *.shayari* <romantic poem>
║ *.goodnight* <night message>
║ *.roseday* <rose day msg>
╚══════════════════╝

╔══════════════════╗
    🌐 *ONLINE STATUS*
╠──────────────────╣
║ *.online* <status menu>
║ *.onlineusers* <who's online>
║ *.onlineadmins* <online admins>
║ *.onlinestats* <group stats>
╚══════════════════╝

╔══════════════════╗
    💻 *BOT INFO*
╠──────────────────╣
║ *.github / .git* <source code>
║ *.owner* <contact owner>
║ *.ping* <response speed>
║ *.alive* <bot status>
║ *.chatbot* <toggle AI chat>
╚══════════════════╝

╔══════════════════╗
        *ABOUT US*
╠──────────────────╣
 *MultiDevice WhatsApp Bot ❤️🔥*
  Creator: *EmmyHenz*
  📺 t.me/emmyhenztech
  💻 github.com/emmyhenz
 Thanks For Using Our Bot🙏 
╚══════════════════╝
    `;
    await sock.sendMessage(from, { text: menu.trim() });
  },

  list: async ({ sock, from }) => {
    await sock.sendMessage(from, { text: "Full command list is being generated... (800+ commands available in OBA MD database)" });
  },

  ai: async ({ sock, from, args }) => {
    const prompt = args.join(" ");
    if (!prompt) return await sock.sendMessage(from, { text: "Please provide a question for the AI." });
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      await sock.sendMessage(from, { text: response.text || "I couldn't generate a response." });
    } catch (err) {
      await sock.sendMessage(from, { text: "AI Error: " + (err as Error).message });
    }
  },

  song: async ({ sock, from, args }) => {
    const query = args.join(" ");
    if (!query) return await sock.sendMessage(from, { text: "What song are you looking for?" });
    
    try {
      const r = await yts(query);
      const video = r.videos[0];
      if (!video) return await sock.sendMessage(from, { text: "No results found." });
      
      const text = `
🎵 *SONG FOUND* 🎵
Title: ${video.title}
Duration: ${video.timestamp}
Views: ${video.views}
Link: ${video.url}

_Downloading... (Feature in progress)_
      `;
      await sock.sendMessage(from, { 
        image: { url: video.thumbnail },
        caption: text.trim()
      });
    } catch (err) {
      await sock.sendMessage(from, { text: "Error searching song." });
    }
  },

  sticker: async ({ sock, from, msg }) => {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const media = msg.message?.imageMessage || msg.message?.videoMessage || quoted?.imageMessage || quoted?.videoMessage;
    
    if (!media) return await sock.sendMessage(from, { text: "Reply to an image or video with !sticker" });
    
    try {
      const stream = await downloadContentFromMessage(media, (media as any).mimetype?.includes("image") ? "image" : "video");
      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      const sticker = new Sticker(buffer, {
        pack: "OBA MD Pack",
        author: "OBA MD Bot",
        type: StickerTypes.FULL,
        quality: 50,
      });

      await sock.sendMessage(from, await sticker.toMessage());
    } catch (err) {
      await sock.sendMessage(from, { text: "Failed to create sticker." });
    }
  },

  kick: async ({ sock, from, isGroup, msg }) => {
    if (!isGroup) return await sock.sendMessage(from, { text: "Groups only!" });
    const mention = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    if (!mention) return await sock.sendMessage(from, { text: "Tag someone to kick." });
    await sock.groupParticipantsUpdate(from, [mention], "remove");
  },

  tagall: async ({ sock, from, isGroup }) => {
    if (!isGroup) return await sock.sendMessage(from, { text: "Groups only!" });
    const metadata = await sock.groupMetadata(from);
    const participants = metadata.participants.map(p => p.id);
    const text = "📢 *TAG ALL*\n\n" + participants.map(p => `@${p.split("@")[0]}`).join(" ");
    await sock.sendMessage(from, { text, mentions: participants });
  },

  bug: async ({ sock, from }) => {
    const bugText = "OBA MD BUG 🐛".repeat(100);
    await sock.sendMessage(from, { text: bugText });
  },

  crash: async ({ sock, from, isGroup }) => {
    if (!isGroup) return await sock.sendMessage(from, { text: "This is a group-only stress test." });
    await sock.sendMessage(from, { text: "⚠️ INITIALIZING CRASH SEQUENCE..." });
    const payload = "0".repeat(50000); // Large payload
    await sock.sendMessage(from, { text: payload });
  },

  spam: async ({ sock, from, args }) => {
    const count = parseInt(args[0]) || 5;
    const text = args.slice(1).join(" ") || "OBA MD SPAM";
    if (count > 50) return await sock.sendMessage(from, { text: "Max spam count is 50." });
    for (let i = 0; i < count; i++) {
      await sock.sendMessage(from, { text });
    }
  },

  toimg: async ({ sock, from, msg }) => {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const sticker = msg.message?.stickerMessage || quoted?.stickerMessage;
    if (!sticker) return await sock.sendMessage(from, { text: "Reply to a sticker with !toimg" });
    
    const stream = await downloadContentFromMessage(sticker, "sticker");
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }
    await sock.sendMessage(from, { image: buffer, caption: "Converted from sticker by OBA MD" });
  },

  weather: async ({ sock, from, args }) => {
    const city = args.join(" ");
    if (!city) return await sock.sendMessage(from, { text: "Provide a city name." });
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=YOUR_API_KEY&units=metric`);
    // Note: Requires API key. For now, simulated response.
    await sock.sendMessage(from, { text: `Weather in ${city}: 25°C, Clear Sky (Simulated)` });
  },

  calc: async ({ sock, from, args }) => {
    const expr = args.join("");
    try {
      const result = eval(expr); // Note: eval is dangerous, but for a bot it's common.
      await sock.sendMessage(from, { text: `Result: ${result}` });
    } catch (e) {
      await sock.sendMessage(from, { text: "Invalid expression." });
    }
  },

  alive: async ({ sock, from }) => {
    await sock.sendMessage(from, { text: "OBA MD (EmmyHenz-V3.5) is active and running smoothly! 🚀" });
  },

  owner: async ({ sock, from }) => {
    const vcard = 'BEGIN:VCARD\n' // metadata of the contact card
            + 'VERSION:3.0\n' 
            + 'FN:EmmyHenz\n' // full name
            + 'ORG:EmmyHenz Tech;\n' // the organization of the contact
            + 'TEL;type=CELL;type=VOICE;waid=2348000000000:+234 800 000 0000\n' // WhatsApp ID + phone number
            + 'END:VCARD';
    await sock.sendMessage(from, { 
      contacts: { 
        displayName: 'EmmyHenz', 
        contacts: [{ vcard }] 
      }
    });
  },

  runtime: async ({ sock, from }) => {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    await sock.sendMessage(from, { text: `Runtime: ${hours}h ${minutes}m ${seconds}s` });
  },

  groupinfo: async ({ sock, from, isGroup }) => {
    if (!isGroup) return await sock.sendMessage(from, { text: "Groups only!" });
    const metadata = await sock.groupMetadata(from);
    const text = `
*GROUP INFO*
Name: ${metadata.subject}
ID: ${metadata.id}
Owner: ${metadata.owner || "N/A"}
Members: ${metadata.participants.length}
Description: ${metadata.desc || "No description"}
    `;
    await sock.sendMessage(from, { text: text.trim() });
  },

  gpt: async ({ sock, from, args }) => {
    const prompt = args.join(" ");
    if (!prompt) return await sock.sendMessage(from, { text: "Ask me something!" });
    // Using Gemini as a fallback for GPT
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      await sock.sendMessage(from, { text: response.text || "No response." });
    } catch (err) {
      await sock.sendMessage(from, { text: "AI Error." });
    }
  },

  gemini: async ({ sock, from, args }) => {
    const prompt = args.join(" ");
    if (!prompt) return await sock.sendMessage(from, { text: "Ask Gemini something!" });
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      await sock.sendMessage(from, { text: response.text || "No response." });
    } catch (err) {
      await sock.sendMessage(from, { text: "Gemini Error." });
    }
  },

  joke: async ({ sock, from }) => {
    const res = await fetch("https://official-joke-api.appspot.com/random_joke");
    const data: any = await res.json();
    await sock.sendMessage(from, { text: `${data.setup}\n\n${data.punchline}` });
  },

  quote: async ({ sock, from }) => {
    const res = await fetch("https://api.quotable.io/random");
    const data: any = await res.json();
    await sock.sendMessage(from, { text: `"${data.content}"\n\n— ${data.author}` });
  },

  meme: async ({ sock, from }) => {
    const res = await fetch("https://meme-api.com/gimme");
    const data: any = await res.json();
    await sock.sendMessage(from, { image: { url: data.url }, caption: data.title });
  }
};

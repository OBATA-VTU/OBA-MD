import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { 
  Plus, 
  Trash2, 
  RefreshCw, 
  Smartphone, 
  QrCode, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Terminal,
  Shield,
  Zap,
  Cpu,
  Activity,
  Command,
  Search,
  ChevronRight,
  AlertTriangle,
  Bug,
  Music,
  Video,
  Image as ImageIcon,
  MessageSquare,
  Lock,
  Globe,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

const socket = io();

interface Session {
  id: string;
  status: "connected" | "disconnected" | "connecting" | "deleted";
}

export default function App() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [newSessionId, setNewSessionId] = useState("");
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
  const [pairingCodes, setPairingCodes] = useState<Record<string, string>>({});
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [pairingLoading, setPairingLoading] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    fetchSessions();

    socket.on("connect", () => console.log("Connected to OBA MD Core"));

    socket.onAny((event, data) => {
      if (event.startsWith("status:")) {
        const id = event.split(":")[1];
        setSessions(prev => prev.map(s => s.id === id ? { ...s, status: data } : s));
        if (data === "connected") {
          toast.success(`SYSTEM: Session ${id} established.`, {
            description: "Bot is now active on WhatsApp.",
            className: "bg-primary text-primary-foreground"
          });
          setQrCodes(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
          setPairingCodes(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
          setPairingLoading(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
        }
      }
      if (event.startsWith("qr:")) {
        const id = event.split(":")[1];
        setQrCodes(prev => ({ ...prev, [id]: data }));
      }
      if (event.startsWith("pairing-code:")) {
        const id = event.split(":")[1];
        setPairingCodes(prev => ({ ...prev, [id]: data }));
        setPairingLoading(prev => ({ ...prev, [id]: false }));
        toast.info(`PAIRING CODE: ${data} generated for ${id}`);
      }
      if (event.startsWith("error:")) {
        const id = event.split(":")[1] || "system";
        setPairingLoading(prev => ({ ...prev, [id]: false }));
        toast.error("SYSTEM ERROR", { description: data });
      }
    });

    return () => {
      socket.off();
    };
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await axios.get("/api/sessions");
      setSessions(res.data);
    } catch (err) {
      toast.error("COMMUNICATION ERROR", { description: "Failed to sync with core." });
    }
  };

  const createSession = async () => {
    if (!newSessionId) return;
    setLoading(true);
    try {
      await axios.post("/api/sessions/create", { sessionId: newSessionId });
      setNewSessionId("");
      fetchSessions();
      toast.info("INITIALIZING...", { description: `Session ${newSessionId} creation sequence started.` });
    } catch (err) {
      toast.error("INITIALIZATION FAILED");
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = async (id: string) => {
    try {
      await axios.post("/api/sessions/delete", { sessionId: id });
      fetchSessions();
      toast.warning("TERMINATED", { description: `Session ${id} has been purged.` });
    } catch (err) {
      toast.error("PURGE FAILED");
    }
  };

  const requestPairingCode = async (id: string) => {
    if (!phoneNumber) return toast.error("INPUT REQUIRED", { description: "Phone number is missing." });
    setPairingLoading(prev => ({ ...prev, [id]: true }));
    setPairingCodes(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    try {
      await axios.post("/api/sessions/pairing-code", { sessionId: id, phoneNumber });
      toast.info("REQUEST SENT", { description: "Waiting for pairing code from WhatsApp..." });
    } catch (err) {
      setPairingLoading(prev => ({ ...prev, [id]: false }));
      toast.error("PAIRING REQUEST FAILED");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-mono selection:bg-primary selection:text-primary-foreground">
      <Toaster position="bottom-right" theme="dark" />
      
      {/* Top Bar */}
      <div className="border-b border-primary/20 bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 border border-primary/30 flex items-center justify-center rounded-sm">
              <Cpu className="text-primary h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tighter glitch-text">OBA MD <span className="text-primary">CORE v2.0</span></h1>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><Activity className="h-3 w-3 text-primary" /> SYSTEM READY</span>
                <span className="w-1 h-1 bg-muted-foreground rounded-full"></span>
                <span>LATENCY: 24ms</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-sm border border-border">
              <Plus className="h-4 w-4 text-primary" />
              <input 
                type="text" 
                placeholder="BOT_NAME" 
                className="bg-transparent border-none outline-none text-xs w-24 md:w-32 uppercase placeholder:opacity-30"
                value={newSessionId}
                onChange={(e) => setNewSessionId(e.target.value.toUpperCase())}
              />
              <Button size="sm" className="h-6 px-2 text-[10px]" onClick={createSession} disabled={loading}>
                {loading ? <Loader2 className="animate-spin h-3 w-3" /> : "DEPLOY"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-3 space-y-6">
          <div className="space-y-1">
            <NavButton active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} icon={<Terminal />} label="DASHBOARD" />
            <NavButton active={activeTab === "commands"} onClick={() => setActiveTab("commands")} icon={<Command />} label="COMMANDS" />
            <NavButton active={activeTab === "logs"} onClick={() => setActiveTab("logs")} icon={<Activity />} label="SYSTEM LOGS" />
            <NavButton active={activeTab === "settings"} onClick={() => setActiveTab("settings")} icon={<Settings />} label="CONFIG" />
          </div>

          <div className="cyber-card p-4 space-y-4">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>SYSTEM STATUS</span>
              <span className="text-primary">ONLINE</span>
            </div>
            <div className="space-y-2">
              <div className="h-1 bg-secondary w-full rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-primary" 
                  initial={{ width: "0%" }} 
                  animate={{ width: "65%" }} 
                />
              </div>
              <div className="flex justify-between text-[9px]">
                <span>CPU USAGE</span>
                <span>65%</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-1 bg-secondary w-full rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-primary" 
                  initial={{ width: "0%" }} 
                  animate={{ width: "42%" }} 
                />
              </div>
              <div className="flex justify-between text-[9px]">
                <span>MEMORY</span>
                <span>1.2GB / 4GB</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-9">
          <AnimatePresence mode="wait">
            {activeTab === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Zap className="text-primary" /> ACTIVE_INSTANCES
                  </h2>
                  <Badge variant="outline" className="border-primary/30 text-primary">
                    {sessions.length} TOTAL
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {sessions.map((session: Session) => (
                    <SessionCard 
                      key={session.id} 
                      session={session} 
                      qr={qrCodes[session.id]} 
                      pairingCode={pairingCodes[session.id]}
                      pairingLoading={pairingLoading[session.id]}
                      onDelete={() => { deleteSession(session.id); }}
                      onPair={(num: string) => {
                        setPhoneNumber(num);
                        requestPairingCode(session.id);
                      }}
                    />
                  ))}
                  
                  {sessions.length === 0 && (
                    <div className="col-span-full cyber-card p-12 flex flex-col items-center justify-center border-dashed border-primary/30 bg-primary/5">
                      <Terminal className="h-12 w-12 mb-4 text-primary animate-pulse" />
                      <h3 className="text-lg font-bold mb-2 tracking-widest">READY_FOR_DEPLOYMENT</h3>
                      <p className="text-xs text-muted-foreground mb-6 text-center max-w-md">
                        No active bot instances detected. Initialize your first OBA MD session to begin linking your WhatsApp account.
                      </p>
                      <div className="flex flex-col gap-4 w-full max-w-xs">
                        <div className="flex gap-2">
                          <Input 
                            placeholder="SESSION_NAME" 
                            className="bg-secondary border-primary/20"
                            value={newSessionId}
                            onChange={(e) => setNewSessionId(e.target.value.toUpperCase())}
                          />
                          <Button onClick={createSession} disabled={loading}>
                            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "START"}
                          </Button>
                        </div>
                        
                        <div className="p-4 bg-secondary/50 border border-border rounded-sm space-y-2">
                          <p className="text-[10px] font-bold text-primary">QUICK_START_GUIDE:</p>
                          <ol className="text-[9px] text-muted-foreground space-y-1 list-decimal list-inside">
                            <li>Enter a name for your bot above and click START.</li>
                            <li>A bot card will appear with a QR code.</li>
                            <li>Scan the QR with WhatsApp OR use the "Pairing Code" option.</li>
                            <li>Once connected, type !menu in WhatsApp to see commands.</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "commands" && (
              <motion.div
                key="commands"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Command className="text-primary" /> COMMAND_DATABASE
                  </h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="SEARCH_800_COMMANDS..." className="pl-10 w-64 bg-secondary border-primary/20" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CommandGroup title="CORE_SYSTEM" icon={<Shield />} commands={[
                    { name: "ping", desc: "Latency check" },
                    { name: "menu", desc: "Main interface" },
                    { name: "info", desc: "System specs" },
                    { name: "runtime", desc: "Uptime counter" },
                    { name: "restart", desc: "Reboot instance" },
                    { name: "update", desc: "Check for patches" },
                  ]} />
                  <CommandGroup title="GROUP_OPS" icon={<Users />} commands={[
                    { name: "kick", desc: "Purge member" },
                    { name: "add", desc: "Invite member" },
                    { name: "promote", desc: "Elevate to admin" },
                    { name: "demote", desc: "Revoke admin" },
                    { name: "tagall", desc: "Mass mention" },
                    { name: "hidetag", desc: "Ghost mention" },
                  ]} />
                  <CommandGroup title="MEDIA_X" icon={<ImageIcon />} commands={[
                    { name: "sticker", desc: "IMG -> WEBP" },
                    { name: "toimg", desc: "WEBP -> IMG" },
                    { name: "song", desc: "YT -> MP3" },
                    { name: "video", desc: "YT -> MP4" },
                    { name: "img", desc: "Google search" },
                    { name: "play", desc: "Stream audio" },
                  ]} />
                  <CommandGroup title="BUG_STRESS" icon={<Bug />} commands={[
                    { name: "bug", desc: "Send payload" },
                    { name: "crash", desc: "Buffer overflow" },
                    { name: "spam", desc: "Message flood" },
                    { name: "lag", desc: "UI freeze text" },
                    { name: "kill", desc: "Terminate chat" },
                    { name: "bomb", desc: "Multi-spam" },
                  ]} />
                </div>
                
                <div className="cyber-card p-4 text-center border-dashed opacity-50">
                  <p className="text-[10px]">... AND 750+ MORE COMMANDS IN THE OBA MD REPOSITORY ...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold transition-all border-l-2 ${
        active 
          ? "bg-primary/10 border-primary text-primary" 
          : "border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground"
      }`}
    >
      {icon}
      <span>{label}</span>
      {active && <ChevronRight className="ml-auto h-4 w-4" />}
    </button>
  );
}

function SessionCard({ session, qr, pairingCode, pairingLoading, onDelete, onPair }: any) {
  const [num, setNum] = useState("");

  return (
    <div className="cyber-card group overflow-hidden">
      <div className="p-4 border-b border-border flex justify-between items-center bg-secondary/30">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${session.status === "connected" ? "bg-primary animate-pulse shadow-[0_0_8px_var(--primary)]" : "bg-muted-foreground"}`} />
          <span className="text-xs font-bold uppercase tracking-widest">{session.id}</span>
        </div>
        <button onClick={onDelete} className="text-muted-foreground hover:text-destructive transition-colors">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {session.status === "connected" ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-4">
            <div className="relative">
              <Smartphone className="h-16 w-16 text-primary" />
              <div className="absolute -top-1 -right-1">
                <CheckCircle2 className="h-6 w-6 text-primary bg-background rounded-full" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold">LINK_ESTABLISHED</p>
              <p className="text-[10px] text-muted-foreground mt-1">INSTANCE IS OPERATIONAL</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              {qr ? (
                <div className="relative p-2 bg-white rounded-sm">
                  <img src={qr} alt="QR" className="w-40 h-40" />
                  <div className="absolute inset-0 border-4 border-primary/20 pointer-events-none" />
                </div>
              ) : (
                <div className="w-40 h-40 bg-secondary flex flex-col items-center justify-center border border-dashed border-primary/20">
                  <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
                  <span className="text-[8px] text-muted-foreground">GENERATING_QR...</span>
                </div>
              )}
              <p className="text-[9px] text-center text-muted-foreground uppercase tracking-tighter">
                SCAN WITH WHATSAPP TO INITIALIZE
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[10px] text-primary font-bold">
                <Lock className="h-3 w-3" /> PAIRING_CODE_BYPASS
              </div>
              <div className="flex gap-2">
                <Input 
                  placeholder="PHONE_NUMBER (e.g. 234...)" 
                  className="h-8 text-[10px] bg-secondary border-primary/20"
                  value={num}
                  onChange={(e) => setNum(e.target.value)}
                />
                <Button size="sm" className="h-8 text-[10px] px-3" onClick={() => onPair(num)} disabled={pairingLoading}>
                  {pairingLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "REQUEST"}
                </Button>
              </div>
              {pairingCode && (
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="p-3 bg-primary text-primary-foreground text-center font-bold text-lg tracking-[0.5em] rounded-sm shadow-[0_0_15px_var(--primary)]"
                >
                  {pairingCode}
                </motion.div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-2 bg-secondary/50 border-t border-border flex items-center justify-between text-[8px]">
        <span className="text-muted-foreground">STATUS: {session.status.toUpperCase()}</span>
        <span className="text-primary opacity-50">OBA_MD_ENGINE_v2</span>
      </div>
    </div>
  );
}

function CommandGroup({ title, icon, commands }: { title: string, icon: any, commands: { name: string, desc: string }[] }) {
  return (
    <div className="cyber-card p-4 space-y-4">
      <div className="flex items-center gap-2 text-xs font-bold text-primary border-b border-primary/20 pb-2">
        {icon}
        {title}
      </div>
      <div className="grid grid-cols-1 gap-2">
        {commands.map((c) => (
          <div key={c.name} className="flex items-center justify-between group cursor-default">
            <span className="text-[11px] font-bold text-foreground/80 group-hover:text-primary transition-colors">!{c.name}</span>
            <span className="text-[9px] text-muted-foreground italic">{c.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Users() {
  return <UsersIcon className="h-4 w-4" />
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}

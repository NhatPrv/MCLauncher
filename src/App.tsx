import { useState, useEffect, useRef, useCallback } from "react";
import {
  Shield,
  Settings,
  Sun,
  Moon,
  ChevronDown,
  RefreshCw,
  Folder,
  Play,
  Users,
  Search,
  Newspaper,
  Layers,
  User,
  Star,
  Clock,
  Download,
  Loader2,
  X,
  ArrowRight,
  CheckCircle,
  FileText,
  Server,
} from "lucide-react";
import { Account, AppConfig } from "./types";
import { invoke } from "@tauri-apps/api/core";

/* ─── Responsive scale hook ──────────────────────────────────────────────── */
const BASE_W = 1024;
const BASE_H = 640;

function useScaleFit() {
  const getScale = useCallback(() => {
    const sw = window.innerWidth;
    const sh = window.innerHeight;
    return Math.min(sw / BASE_W, sh / BASE_H);
  }, []);
  const [scale, setScale] = useState(getScale);
  useEffect(() => {
    const onResize = () => setScale(getScale());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [getScale]);
  return scale;
}

/* ─── Types ──────────────────────────────────────────────────────────────── */
type Tab = "home" | "mods" | "account";
type LoaderType = "vanilla" | "fabric" | "forge" | "optifine";

interface VersionItem {
  id: string;
  label: string;
  sub: string;
  loader: LoaderType;
  versionStr: string;
}

/* ─── Data ───────────────────────────────────────────────────────────────── */
const VERSIONS: VersionItem[] = [
  { id: "1.21.1",          label: "1.21.1",          sub: "Tricky Trials",    loader: "vanilla",  versionStr: "1.21.1" },
  { id: "1.21.1-fabric",   label: "1.21.1 Fabric",   sub: "Loader 0.15.11",  loader: "fabric",   versionStr: "1.21.1" },
  { id: "1.20.4-forge",    label: "1.20.4 Forge",    sub: "49.0.30",          loader: "forge",    versionStr: "1.20.4" },
  { id: "1.20.1-optifine", label: "1.20.1 OptiFine", sub: "HD U I7 pre6",    loader: "optifine", versionStr: "1.20.1" },
  { id: "1.19.4",          label: "1.19.4",          sub: "Vanilla",          loader: "vanilla",  versionStr: "1.19.4" },
];

const LOADER_META: Record<LoaderType, { emoji: string; color: string; bg: string; label: string }> = {
  vanilla:  { emoji: "📦", color: "#818cf8", bg: "rgba(99,102,241,0.15)",  label: "Vanilla"  },
  fabric:   { emoji: "⚡", color: "#fbbf24", bg: "rgba(251,191,36,0.15)",  label: "Fabric"   },
  forge:    { emoji: "🔨", color: "#f87171", bg: "rgba(248,113,113,0.15)", label: "Forge"    },
  optifine: { emoji: "🔍", color: "#22d3ee", bg: "rgba(34,211,238,0.15)",  label: "OptiFine" },
};

const SERVERS = [
  { name: "Hypixel",        address: "mc.hypixel.net",     ping: 34,  players: 87432, icon: "⚔️",  tag: "Mini-Games" },
  { name: "Complex Gaming", address: "hub.mc-complex.com", ping: 71,  players: 12904, icon: "🏙️",  tag: "Survival"   },
  { name: "Mineplex",       address: "us.mineplex.com",    ping: 108, players: 4201,  icon: "🌐",  tag: "Arcade"     },
];

const PATCH_NOTES = [
  "Armadillo + Scute shield crafting recipe added",
  "Trial Chambers dungeon structure with new Breeze mob",
  "Mace weapon with Wind Charge knockback mechanics",
  "Copper Bulb, Chiseled Copper blocks & oxidation states",
  "Crafter block — the first semi-automated crafting station",
];

const MODS = [
  { name: "Sodium",           author: "CaffeineMC", dl: "4.2M",  version: "mc1.21.1-0.5.8",     tag: "Performance", color: "#f59e0b" },
  { name: "Iris Shaders",     author: "coderbot",    dl: "3.8M",  version: "1.7.0+mc1.21",       tag: "Visual",      color: "#06b6d4" },
  { name: "Lithium",          author: "CaffeineMC", dl: "2.9M",  version: "mc1.21-0.12.1",      tag: "Performance", color: "#10b981" },
  { name: "Create",           author: "simibubi",    dl: "8.1M",  version: "0.5.1-f-build.1408", tag: "Tech",        color: "#f97316" },
  { name: "Biomes O' Plenty", author: "Forstride",  dl: "6.4M",  version: "18.0.0.499",         tag: "World",       color: "#84cc16" },
  { name: "AppleSkin",        author: "squeek502",   dl: "5.0M",  version: "2.5.1+mc1.21",       tag: "HUD",         color: "#ec4899" },
];

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function PingBar({ ping }: { ping: number }) {
  const color = ping < 60 ? "#10b981" : ping < 100 ? "#fbbf24" : "#f87171";
  const bars  = ping < 60 ? 3 : ping < 100 ? 2 : 1;
  return (
    <span className="inline-flex items-end gap-[2px]">
      {[1, 2, 3].map((i) => (
        <span key={i} style={{ display: "block", width: 3, height: 4 + i * 2, borderRadius: 1, background: i <= bars ? color : "rgba(100,116,139,0.3)" }} />
      ))}
      <span className="ml-1 font-mono text-[10px]" style={{ color, lineHeight: 1 }}>{ping}ms</span>
    </span>
  );
}

function LoaderBadge({ loader }: { loader: LoaderType }) {
  const { emoji, color, bg, label } = LOADER_META[loader];
  return (
    <span className="inline-flex items-center gap-1 rounded-md font-semibold px-2 py-0.5" style={{ background: bg, color, fontSize: 10, border: `1px solid ${color}22` }}>
      <span>{emoji}</span> {label}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export function App() {
  const scale = useScaleFit();
  const [dark, setDark]                     = useState(true);
  const [activeTab, setActiveTab]           = useState<Tab>("home");
  const [selectedVersion, setSelectedVersion] = useState(VERSIONS[0]);
  const [versionOpen, setVersionOpen]       = useState(false);
  const [isLaunching, setIsLaunching]       = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [noteIdx, setNoteIdx]               = useState(0);
  const [offlineNameInput, setOfflineNameInput] = useState("Steve_MC_2024");
  const dropRef = useRef<HTMLDivElement>(null);

  const [account, setAccount] = useState<Account | null>({
    username: "Steve_MC_2024",
    uuid: "c0618b45-4202-3ac8-9f20-94d3fd4695ec",
    access_token: "offline_token",
    account_type: "Microsoft",
  });

  const [config, setConfig] = useState<AppConfig>({
    min_ram_mb: 1024, max_ram_mb: 4096,
    java_path: "java",
    resolution_width: 854, resolution_height: 480,
    jvm_args: "-XX:+UseG1GC",
    game_dir: "./.minecraft",
    theme: "dark",
  });

  /* ── Effects */
  useEffect(() => {
    invoke<AppConfig>("get_config").then((cfg) => { if (cfg) { setConfig(cfg); setDark(cfg.theme === "dark"); } }).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNoteIdx((n) => (n + 1) % PATCH_NOTES.length), 3200);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (dropRef.current && !dropRef.current.contains(e.target as Node)) setVersionOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── Handlers */
  const handleToggleTheme = () => {
    const d = !dark; setDark(d);
    const c = { ...config, theme: d ? ("dark" as const) : ("light" as const) }; setConfig(c);
    invoke("update_config", { config: c }).catch(() => {});
  };

  const handlePlay = async () => {
    setIsLaunching(true);
    try {
      let acc = account;
      if (!acc) { acc = await invoke<Account>("login_offline", { username: "Player" }); setAccount(acc); }
      let vid = selectedVersion.versionStr;
      if (selectedVersion.loader !== "vanilla") {
        vid = await invoke<string>("install_mod_loader_cmd", { gameDir: config.game_dir, gameVersion: selectedVersion.versionStr, loaderName: selectedVersion.loader, loaderVersion: "latest" });
      }
      await invoke<number>("launch_minecraft", { versionId: vid, account: acc, config });
      setTimeout(() => setIsLaunching(false), 2500);
    } catch (err: any) { setIsLaunching(false); alert("Khởi chạy thất bại: " + (err?.message || err)); }
  };

  const handleOpenFolder = () => { invoke("plugin:opener|open_path", { path: config.game_dir }).catch(() => alert(`Game dir: ${config.game_dir}`)); };

  const handleSaveOfflineName = async (e: React.FormEvent) => {
    e.preventDefault(); if (!offlineNameInput.trim()) return;
    try { const a = await invoke<Account>("login_offline", { username: offlineNameInput.trim() }); setAccount(a); } catch (err: any) { alert("Lỗi: " + err); }
  };

  /* ── Palette */
  const border = dark ? "#1e293b" : "#e2e8f0";
  const sub    = dark ? "#94a3b8" : "#64748b";
  const cardBg = dark ? "rgba(15,23,42,0.65)" : "rgba(255,255,255,0.85)";

  /* ──────────────────────────────────────────────────────────────────────── */
  return (
    <div style={{ width: "100vw", height: "100vh", background: dark ? "#020617" : "#cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <div style={{ width: BASE_W, height: BASE_H, transform: `scale(${scale})`, transformOrigin: "center center", flexShrink: 0 }}>
        <div className="relative flex flex-col overflow-hidden shadow-2xl select-none" style={{ width: BASE_W, height: BASE_H, background: dark ? "#0f172a" : "#f8fafc", color: dark ? "#e2e8f0" : "#0f172a", fontFamily: "'Inter', system-ui, sans-serif" }}>

          {/* Grid overlay */}
          {dark && <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(30,41,59,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(30,41,59,0.4) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />}
          <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse 80% 50% at 50% -10%, rgba(16,185,129,0.07) 0%, transparent 60%)` }} />

          {/* ═══ TOP NAVBAR ═══ */}
          <nav className="relative z-20 flex items-center px-5 flex-shrink-0" style={{ height: 56, borderBottom: `1px solid ${border}`, background: dark ? "rgba(15,23,42,0.88)" : "rgba(255,255,255,0.88)", backdropFilter: "blur(12px)" }}>
            {/* Logo */}
            <div className="flex items-center gap-2.5 min-w-[170px]">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #10b981, #059669)", boxShadow: "0 0 12px rgba(16,185,129,0.5)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2L3 7v10l9 5 9-5V7L12 2z" fill="rgba(255,255,255,0.9)" /><path d="M12 2L3 7l9 5 9-5L12 2z" fill="rgba(255,255,255,0.4)" /></svg>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm tracking-tight">MCLauncher</span>
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold text-white" style={{ background: "linear-gradient(135deg,#10b981,#059669)", boxShadow: "0 0 6px rgba(16,185,129,0.4)" }}>
                    <Shield size={7} className="inline mr-0.5" style={{verticalAlign: "middle"}} />PRO
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 -mt-0.5">v4.2.1 · Verified</div>
              </div>
            </div>

            {/* Center Tabs */}
            <div className="flex-1 flex items-center justify-center gap-1">
              {([
                { id: "home", label: "Home & News", icon: Newspaper },
                { id: "mods", label: "Mods & Packs", icon: Layers },
                { id: "account", label: "Account", icon: User },
              ] as { id: Tab; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
                  style={{
                    background: activeTab === id ? "rgba(16,185,129,0.15)" : "transparent",
                    color: activeTab === id ? "#10b981" : sub,
                    border: activeTab === id ? "1px solid rgba(16,185,129,0.3)" : "1px solid transparent",
                  }}
                >
                  <Icon size={13} />
                  {label}
                </button>
              ))}
            </div>

            {/* Right */}
            <div className="flex items-center gap-2 min-w-[170px] justify-end">
              <button onClick={() => setIsSettingsOpen(true)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: dark ? "rgba(30,41,59,0.6)" : "rgba(226,232,240,0.7)", color: sub }}>
                <Settings size={14} />
              </button>
              <button onClick={handleToggleTheme} className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: dark ? "rgba(30,41,59,0.6)" : "rgba(226,232,240,0.7)", color: sub }}>
                {dark ? <Moon size={12} /> : <Sun size={12} />}
                <div className="relative w-7 h-3.5 rounded-full" style={{ background: dark ? "#10b981" : "#cbd5e1" }}>
                  <div className="absolute top-[2px] w-2.5 h-2.5 rounded-full bg-white transition-all duration-200" style={{ left: dark ? "calc(100% - 12px)" : "2px" }} />
                </div>
              </button>
            </div>
          </nav>

          {/* ═══ MAIN CONTENT ═══ */}
          <div className="flex-1 overflow-y-auto relative z-10 px-5 py-4" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(16,185,129,0.2) transparent" }}>

            {/* ─── TAB: HOME ─── */}
            {activeTab === "home" && (
              <div className="space-y-4">
                {/* Hero Banner — 2-column split like Figma */}
                <div className="relative rounded-2xl overflow-hidden" style={{ height: 195, background: dark ? "#0c1322" : "#e2e8f0", border: `1px solid ${border}` }}>
                  {/* Right-side image with diagonal clip */}
                  <div className="absolute right-0 top-0 bottom-0" style={{ width: "55%", clipPath: "polygon(15% 0, 100% 0, 100% 100%, 0 100%)" }}>
                    <img src="https://images.unsplash.com/photo-1629429407759-01cd3d7cfb38?w=600&h=200&fit=crop&auto=format" alt="" className="w-full h-full object-cover" style={{ filter: "brightness(0.6) saturate(1.2)" }} />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(270deg, transparent 60%, rgba(12,19,34,0.95) 100%)" }} />
                  </div>

                  {/* "Compatible with your mods" badge top-right */}
                  <div className="absolute top-3 right-4 flex items-center gap-1 text-[10px] text-emerald-400 font-semibold z-10">
                    <CheckCircle size={10} />
                    Compatible with your mods
                  </div>

                  {/* Left text content */}
                  <div className="absolute inset-0 flex flex-col justify-center pl-6 pr-[50%] z-10">
                    {/* Tags */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-widest text-white" style={{ background: "linear-gradient(135deg,#10b981,#059669)", boxShadow: "0 0 8px rgba(16,185,129,0.4)" }}>
                        ✦ Latest Release
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock size={9} /> Released Jul 12, 2024
                      </span>
                    </div>

                    {/* Title */}
                    <h1 className="text-[26px] font-extrabold leading-[1.1] tracking-tight text-white mb-1">
                      Minecraft <span style={{ color: "#10b981" }}>1.21.1</span>
                      <br />Tricky Trials Update
                    </h1>

                    {/* Patch note ticker */}
                    <div className="flex items-center gap-2 mb-4 text-[10px]">
                      <span className="font-bold text-emerald-400 uppercase tracking-wider">What's New</span>
                      <span className="text-slate-400 truncate max-w-[220px] transition-all duration-300" key={noteIdx}>
                        {PATCH_NOTES[noteIdx]}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      <button onClick={handlePlay} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold text-white hover:scale-105 transition-all" style={{ background: "linear-gradient(135deg,#10b981,#059669)", boxShadow: "0 0 16px rgba(16,185,129,0.4)" }}>
                        <Play size={12} fill="currentColor" /> Play 1.21.1
                      </button>
                      <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-all" style={{ background: dark ? "rgba(30,41,59,0.6)" : "rgba(226,232,240,0.7)", border: `1px solid ${border}` }}>
                        <FileText size={11} /> Full Patch Notes
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3-Column Cards */}
                <div className="grid grid-cols-3 gap-3">
                  {/* News Card */}
                  <div className="rounded-2xl overflow-hidden transition-all hover:scale-[1.02] cursor-pointer group" style={{ background: cardBg, border: `1px solid ${border}`, backdropFilter: "blur(8px)" }}>
                    <div className="relative h-[110px] overflow-hidden">
                      <img src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=120&fit=crop&auto=format" alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-500 text-white tracking-wider">News</span>
                      <span className="absolute bottom-2 right-2.5 text-[9px] text-slate-400 flex items-center gap-1"><Clock size={8} /> 3 days ago</span>
                    </div>
                    <div className="p-3">
                      <h3 className="font-bold text-[13px] mb-1 leading-snug">Mob Vote 2024: Armadillo Wins Community Poll</h3>
                      <p className="text-[11px] text-slate-400 leading-relaxed mb-2">The Armadillo claimed 42% of votes. Now live in Minecraft 1.21 with Wolf Armor crafting.</p>
                      <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">Read more <ArrowRight size={10} /></span>
                    </div>
                  </div>

                  {/* Fabric Card */}
                  <div className="rounded-2xl overflow-hidden transition-all hover:scale-[1.02] cursor-pointer group" style={{ background: cardBg, border: `1px solid ${border}`, backdropFilter: "blur(8px)" }}>
                    <div className="relative h-[110px] overflow-hidden flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)" }}>
                      {/* Diagonal stripes */}
                      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(129,140,248,0.3) 8px, rgba(129,140,248,0.3) 9px)", backgroundSize: "12px 12px" }} />
                      <div className="text-center z-10">
                        <div className="text-3xl mb-1">⚡</div>
                        <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-400">Fabric Loader</div>
                      </div>
                      <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded text-[8px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 tracking-wider">Updated</span>
                    </div>
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-[13px]">Fabric 0.15.11</h3>
                        <span className="text-[10px] text-slate-500 font-mono">mc1.21.1</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed mb-2">Improved 1.21.1 support, 18% faster mod loading, and 6 critical bug fixes.</p>
                      <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                        <Download size={10} /> Install Fabric
                      </span>
                    </div>
                  </div>

                  {/* Iris Shaders Card */}
                  <div className="rounded-2xl overflow-hidden transition-all hover:scale-[1.02] cursor-pointer group" style={{ background: cardBg, border: `1px solid ${border}`, backdropFilter: "blur(8px)" }}>
                    <div className="relative h-[110px] overflow-hidden">
                      <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=120&fit=crop&auto=format" alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-black/40 text-amber-400 text-[10px] font-bold backdrop-blur-sm">
                        <Star size={9} fill="currentColor" /> 4.9
                      </div>
                      <div className="absolute bottom-2 left-3 text-[10px] font-bold text-cyan-400 tracking-wider uppercase">
                        ✦ Iris Shaders
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-bold text-[13px] mb-1">Complementary v5.3</h3>
                      <p className="text-[11px] text-slate-400 leading-relaxed mb-2">Volumetric fog, PBR lighting, ray-traced reflections — runs at 90fps on RTX 4070.</p>
                      <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                        <Download size={10} /> Get Shaders Pack
                      </span>
                    </div>
                  </div>
                </div>

                {/* Featured Servers */}
                <div className="rounded-2xl p-3" style={{ background: cardBg, border: `1px solid ${border}`, backdropFilter: "blur(8px)" }}>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <Server size={12} className="text-slate-400" />
                      <span className="font-bold text-[11px] uppercase tracking-wider text-slate-300">Featured Servers</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      3 / 3 online
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {SERVERS.map((s) => (
                      <div key={s.name} className="flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer transition-all hover:scale-[1.02]" style={{ background: dark ? "rgba(15,23,42,0.5)" : "rgba(248,250,252,0.8)", border: `1px solid ${dark ? "rgba(30,41,59,0.6)" : "#e2e8f0"}` }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{ background: dark ? "rgba(30,41,59,0.8)" : "#f1f5f9" }}>{s.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[11px] truncate">{s.name}</span>
                            <PingBar ping={s.ping} />
                          </div>
                          <div className="flex items-center justify-between mt-0.5">
                            <span className="text-[9px] text-slate-500 font-mono">{s.address}</span>
                            <span className="text-[9px] text-slate-400 flex items-center gap-0.5"><Users size={8} />{s.players.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ─── TAB: MODS ─── */}
            {activeTab === "mods" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold">Mods & Modpacks Gallery</h2>
                  <div className="relative w-56">
                    <Search size={13} className="absolute left-3 top-2 text-slate-400" />
                    <input type="text" placeholder="Search mods..." className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs font-semibold outline-none text-slate-100" style={{ background: dark ? "rgba(15,23,42,0.6)" : "#fff", border: `1px solid ${border}` }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {MODS.map((m) => (
                    <div key={m.name} className="p-3 rounded-xl flex items-center justify-between" style={{ background: cardBg, border: `1px solid ${border}`, backdropFilter: "blur(8px)" }}>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-[13px]">{m.name}</h4>
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase" style={{ background: `${m.color}22`, color: m.color }}>{m.tag}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">by {m.author} • {m.dl} downloads</p>
                      </div>
                      <button className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] flex items-center gap-1 transition-colors">
                        <Download size={10} /> Install
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ─── TAB: ACCOUNT ─── */}
            {activeTab === "account" && (
              <div className="space-y-4 max-w-lg mx-auto">
                <h2 className="text-lg font-bold">Account Settings</h2>
                {account && (
                  <div className="p-4 rounded-xl flex items-center justify-between" style={{ background: cardBg, border: `1px solid ${border}` }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl text-white font-bold flex items-center justify-center text-sm" style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>
                        {account.username.substring(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-sm">{account.username}</div>
                        <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> {account.account_type}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="p-4 rounded-xl space-y-3" style={{ background: cardBg, border: `1px solid ${border}` }}>
                  <h3 className="font-bold text-xs uppercase text-slate-400">Change Offline Username</h3>
                  <form onSubmit={handleSaveOfflineName} className="flex gap-2">
                    <input type="text" value={offlineNameInput} onChange={(e) => setOfflineNameInput(e.target.value)} className="flex-1 p-2 rounded-xl text-xs font-mono text-slate-100 outline-none" style={{ background: dark ? "rgba(15,23,42,0.7)" : "#f8fafc", border: `1px solid ${border}` }} />
                    <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white transition-colors">Update</button>
                  </form>
                </div>
              </div>
            )}
          </div>

          {/* ═══ BOTTOM ACTION BAR ═══ */}
          <div className="relative z-20 flex items-center px-5 gap-3 flex-shrink-0" style={{ height: 72, borderTop: `1px solid ${border}`, background: dark ? "rgba(15,23,42,0.92)" : "rgba(255,255,255,0.92)", backdropFilter: "blur(16px)" }}>
            {/* Account card */}
            <div onClick={() => setActiveTab("account")} className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer transition-all hover:scale-[1.02]" style={{ background: dark ? "rgba(30,41,59,0.6)" : "rgba(248,250,252,0.9)", border: `1px solid ${border}`, minWidth: 160 }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white" style={{ background: "linear-gradient(135deg,#10b981,#059669)", boxShadow: "0 0 8px rgba(16,185,129,0.3)" }}>
                {account?.username ? account.username[0].toUpperCase() : "S"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[11px] truncate">{account?.username || "Steve"}</div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[9px] text-emerald-400 font-semibold">{account?.account_type || "Offline"}</span>
                </div>
              </div>
              <ChevronDown size={11} className="text-slate-500" />
            </div>

            {/* Center: Version selector */}
            <div className="flex-1 flex items-center justify-center gap-2" ref={dropRef}>
              <div className="relative">
                <button onClick={() => setVersionOpen(!versionOpen)} className="flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs transition-all hover:scale-[1.02]" style={{ background: dark ? "rgba(30,41,59,0.6)" : "rgba(248,250,252,0.9)", border: `1px solid ${border}`, minWidth: 220 }}>
                  <LoaderBadge loader={selectedVersion.loader} />
                  <div className="flex-1 text-left">
                    <div className="font-bold text-[13px]">{selectedVersion.label.split(" ")[0]}</div>
                    <div className="text-[9px] text-slate-400">{selectedVersion.sub}</div>
                  </div>
                  <ChevronDown size={12} className={`text-slate-400 transition-transform ${versionOpen ? "rotate-180" : ""}`} />
                </button>

                {versionOpen && (
                  <div className="absolute bottom-full mb-2 left-0 right-0 rounded-xl overflow-hidden p-1 shadow-2xl z-50" style={{ background: dark ? "#18181b" : "#fff", border: `1px solid ${border}` }}>
                    {VERSIONS.map((v) => (
                      <button key={v.id} onClick={() => { setSelectedVersion(v); setVersionOpen(false); }} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-left transition-colors ${selectedVersion.id === v.id ? "bg-emerald-500/15 text-emerald-400 font-bold" : "hover:bg-slate-800/50 text-slate-300"}`}>
                        <LoaderBadge loader={v.loader} />
                        <div>
                          <div className="font-semibold">{v.label}</div>
                          <div className="text-[9px] text-slate-500">{v.sub}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110" style={{ background: dark ? "rgba(30,41,59,0.6)" : "rgba(248,250,252,0.9)", border: `1px solid ${border}`, color: sub }}>
                <RefreshCw size={13} />
              </button>
            </div>

            {/* Right: actions & PLAY */}
            <div className="flex items-center gap-2">
              <button onClick={handleOpenFolder} className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110" style={{ background: dark ? "rgba(30,41,59,0.6)" : "rgba(248,250,252,0.9)", border: `1px solid ${border}`, color: sub }} title="Open .minecraft">
                <Folder size={13} />
              </button>
              <button onClick={() => setIsSettingsOpen(true)} className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110" style={{ background: dark ? "rgba(30,41,59,0.6)" : "rgba(248,250,252,0.9)", border: `1px solid ${border}`, color: sub }} title="Settings">
                <Settings size={13} />
              </button>

              {/* PLAY BUTTON */}
              <button disabled={isLaunching} onClick={handlePlay} className="flex items-center gap-2.5 px-6 rounded-xl font-bold transition-all duration-150 hover:scale-[1.03] active:scale-95" style={{ height: 48, background: "linear-gradient(135deg,#10b981 0%,#059669 50%,#047857 100%)", color: "#fff", boxShadow: "0 0 28px rgba(16,185,129,0.5), 0 4px 14px rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.12)" }}>
                {isLaunching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play size={17} fill="currentColor" />}
                <div>
                  <div className="text-[15px] font-extrabold tracking-wider leading-none">PLAY</div>
                  <div className="text-[8px] tracking-[0.15em] opacity-80 uppercase leading-none mt-0.5 font-medium">{isLaunching ? "Launching..." : "ENTER THE GAME"}</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-2xl shadow-2xl p-5 space-y-4" style={{ background: dark ? "#0f172a" : "#fff", border: `1px solid ${border}`, color: dark ? "#e2e8f0" : "#0f172a" }}>
            <div className="flex items-center justify-between pb-3" style={{ borderBottom: `1px solid ${border}` }}>
              <h3 className="font-bold text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">MC</span>
                Launcher Settings
              </h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-white"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Max RAM: {config.max_ram_mb} MB</label>
                <input type="range" min="1024" max="16384" step="512" value={config.max_ram_mb} onChange={(e) => setConfig({ ...config, max_ram_mb: Number(e.target.value) })} className="w-full accent-emerald-500 cursor-pointer mt-1" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Java Path</label>
                <input type="text" value={config.java_path} onChange={(e) => setConfig({ ...config, java_path: e.target.value })} className="w-full p-2 mt-1 rounded-xl text-xs font-mono outline-none" style={{ background: dark ? "rgba(15,23,42,0.7)" : "#f8fafc", border: `1px solid ${border}`, color: dark ? "#e2e8f0" : "#0f172a" }} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2" style={{ borderTop: `1px solid ${border}` }}>
              <button onClick={() => setIsSettingsOpen(false)} className="px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background: dark ? "rgba(30,41,59,0.6)" : "#e2e8f0", color: sub }}>Cancel</button>
              <button onClick={() => { invoke("update_config", { config }).catch(() => {}); setIsSettingsOpen(false); }} className="px-4 py-1.5 rounded-xl bg-emerald-600 text-xs font-bold text-white">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

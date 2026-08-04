import { useState, useEffect, useRef } from "react";
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
  ArrowRight,
  CheckCircle,
  FileText,
  Server,
  Loader2,
  X,
} from "lucide-react";
import { Account, AppConfig } from "./types";
import { invoke } from "@tauri-apps/api/core";

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
  { id: "1.21.1-fabric",   label: "1.21.1 Fabric",   sub: "Loader 0.16.0",   loader: "fabric",   versionStr: "1.21.1" },
  { id: "1.20.4-forge",    label: "1.20.4 Forge",    sub: "49.0.30",          loader: "forge",    versionStr: "1.20.4" },
  { id: "1.20.1-optifine", label: "1.20.1 OptiFine", sub: "HD U I7 pre6",    loader: "optifine", versionStr: "1.20.1" },
  { id: "1.19.4",          label: "1.19.4",          sub: "Vanilla",          loader: "vanilla",  versionStr: "1.19.4" },
];

const LOADER_META: Record<LoaderType, { emoji: string; color: string; bg: string; label: string }> = {
  vanilla:  { emoji: "📦", color: "#6366f1", bg: "rgba(99,102,241,0.15)",  label: "Vanilla"  },
  fabric:   { emoji: "⚡", color: "#d97706", bg: "rgba(245,158,11,0.15)",  label: "Fabric"   },
  forge:    { emoji: "🔨", color: "#dc2626", bg: "rgba(239,68,68,0.15)",  label: "Forge"    },
  optifine: { emoji: "🔍", color: "#0891b2", bg: "rgba(6,182,212,0.15)",   label: "OptiFine" },
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
  { name: "Sodium",           author: "CaffeineMC", dl: "4.2M",  tag: "Performance", color: "#f59e0b" },
  { name: "Iris Shaders",     author: "coderbot",    dl: "3.8M",  tag: "Visual",      color: "#06b6d4" },
  { name: "Lithium",          author: "CaffeineMC", dl: "2.9M",  tag: "Performance", color: "#10b981" },
  { name: "Create",           author: "simibubi",    dl: "8.1M",  tag: "Tech",        color: "#f97316" },
  { name: "Biomes O' Plenty", author: "Forstride",  dl: "6.4M",  tag: "World",       color: "#84cc16" },
  { name: "AppleSkin",        author: "squeek502",   dl: "5.0M",  tag: "HUD",         color: "#ec4899" },
];

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function PingBar({ ping }: { ping: number }) {
  const color = ping < 60 ? "#10b981" : ping < 100 ? "#f59e0b" : "#ef4444";
  const bars  = ping < 60 ? 3 : ping < 100 ? 2 : 1;
  return (
    <span className="inline-flex items-end gap-[2px]">
      {[1, 2, 3].map((i) => (
        <span key={i} style={{ display: "block", width: 3, height: 4 + i * 2, borderRadius: 1, background: i <= bars ? color : "rgba(100,116,139,0.3)" }} />
      ))}
      <span className="ml-1 font-mono text-[10px] font-bold" style={{ color, lineHeight: 1 }}>{ping}ms</span>
    </span>
  );
}

function LoaderBadge({ loader }: { loader: LoaderType }) {
  const { emoji, color, bg, label } = LOADER_META[loader];
  return (
    <span className="inline-flex items-center gap-1 rounded-md font-semibold px-2 py-0.5" style={{ background: bg, color, fontSize: 10, border: `1px solid ${color}33` }}>
      <span>{emoji}</span> {label}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT — PERFECT DYNAMIC CONTRAST LIGHT / DARK MODE
═══════════════════════════════════════════════════════════════════════════ */
export function App() {
  const [dark, setDark]                       = useState(true);
  const [activeTab, setActiveTab]             = useState<Tab>("home");
  const [selectedVersion, setSelectedVersion] = useState(VERSIONS[0]);
  const [versionOpen, setVersionOpen]         = useState(false);
  const [isLaunching, setIsLaunching]       = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [noteIdx, setNoteIdx]                 = useState(0);
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

  /* ── Dynamic Contrast Color Tokens */
  const border     = dark ? "#1e293b" : "#cbd5e1";
  const subText    = dark ? "#94a3b8" : "#475569";
  const titleText  = dark ? "#f8fafc" : "#0f172a";
  const cardBg     = dark ? "rgba(15,23,42,0.75)" : "rgba(255,255,255,0.92)";
  const heroBg     = dark ? "#0c1322" : "#f1f5f9";
  const btnBg      = dark ? "rgba(30,41,59,0.7)" : "rgba(226,232,240,0.9)";
  const inputBg    = dark ? "rgba(15,23,42,0.8)" : "#ffffff";

  return (
    <div className={`w-screen h-screen flex flex-col overflow-hidden select-none transition-colors duration-200 ${dark ? "dark bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-900"}`}>
      {/* Background patterns */}
      {dark && (
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(30,41,59,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(30,41,59,0.3) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
      )}
      <div className="absolute inset-0 pointer-events-none" style={{ background: dark ? "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(16,185,129,0.08) 0%, transparent 60%)" : "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(16,185,129,0.04) 0%, transparent 60%)" }} />

      {/* ═══ TOP NAVBAR ═══ */}
      <nav className="relative z-20 flex items-center justify-between px-6 flex-shrink-0 h-14 border-b backdrop-blur-md transition-colors" style={{ borderColor: border, background: dark ? "rgba(15,23,42,0.88)" : "rgba(255,255,255,0.88)" }}>
        {/* Logo Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #10b981, #059669)", boxShadow: "0 0 12px rgba(16,185,129,0.5)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2L3 7v10l9 5 9-5V7L12 2z" fill="rgba(255,255,255,0.9)" /><path d="M12 2L3 7l9 5 9-5L12 2z" fill="rgba(255,255,255,0.4)" /></svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight" style={{ color: titleText }}>MCLauncher</span>
              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold text-white" style={{ background: "linear-gradient(135deg,#10b981,#059669)", boxShadow: "0 0 6px rgba(16,185,129,0.4)" }}>
                <Shield size={7} className="inline mr-0.5" style={{verticalAlign: "middle"}} />PRO
              </span>
            </div>
            <div className="text-[10px] -mt-0.5 font-medium" style={{ color: subText }}>v4.2.1 · Verified</div>
          </div>
        </div>

        {/* Center Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {([
            { id: "home", label: "Home & News", icon: Newspaper },
            { id: "mods", label: "Mods & Packs", icon: Layers },
            { id: "account", label: "Account", icon: User },
          ] as { id: Tab; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              title={label}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200"
              style={{
                background: activeTab === id ? "rgba(16,185,129,0.15)" : "transparent",
                color: activeTab === id ? "#10b981" : subText,
                border: activeTab === id ? "1px solid rgba(16,185,129,0.3)" : "1px solid transparent",
              }}
            >
              <Icon size={14} className="flex-shrink-0" />
              <span className="hidden sm:inline whitespace-nowrap">{label}</span>
            </button>
          ))}
        </div>

        {/* Right Settings & Theme Switcher */}
        <div className="flex items-center gap-2">
          <button onClick={() => setIsSettingsOpen(true)} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105" style={{ background: btnBg, color: subText }}>
            <Settings size={14} />
          </button>
          <button onClick={handleToggleTheme} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all hover:scale-105" style={{ background: btnBg, color: subText }}>
            {dark ? <Moon size={12} className="text-amber-400" /> : <Sun size={12} className="text-amber-500" />}
            <div className="relative w-7 h-3.5 rounded-full" style={{ background: dark ? "#10b981" : "#94a3b8" }}>
              <div className="absolute top-[2px] w-2.5 h-2.5 rounded-full bg-white transition-all duration-200" style={{ left: dark ? "calc(100% - 12px)" : "2px" }} />
            </div>
          </button>
        </div>
      </nav>

      {/* ═══ MAIN CONTENT AREA ═══ */}
      <main className="flex-1 overflow-y-auto relative z-10 px-4 md:px-8 py-5 space-y-5" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(16,185,129,0.3) transparent" }}>

        {/* ─── TAB: HOME ─── */}
        {activeTab === "home" && (
          <div className="max-w-7xl mx-auto space-y-5">
            {/* Hero Banner Split */}
            <div className="relative rounded-2xl overflow-hidden min-h-[200px] flex flex-col md:flex-row border shadow-sm" style={{ background: heroBg, borderColor: border }}>
              {/* Left Content */}
              <div className="flex-1 p-6 z-10 flex flex-col justify-center max-w-2xl">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-widest text-white" style={{ background: "linear-gradient(135deg,#10b981,#059669)", boxShadow: "0 0 8px rgba(16,185,129,0.4)" }}>
                    ✦ Latest Release
                  </span>
                  <span className="text-[10px] flex items-center gap-1 font-medium" style={{ color: subText }}>
                    <Clock size={9} /> Released Jul 12, 2024
                  </span>
                </div>

                <h1 className="text-2xl md:text-3xl font-extrabold leading-tight tracking-tight mb-2" style={{ color: titleText }}>
                  Minecraft <span style={{ color: "#10b981" }}>1.21.1</span>
                  <br />Tricky Trials Update
                </h1>

                <div className="flex items-center gap-2 mb-4 text-xs">
                  <span className="font-bold text-emerald-500 uppercase tracking-wider">What's New</span>
                  <span className="truncate max-w-sm transition-all duration-300 font-medium" style={{ color: subText }} key={noteIdx}>
                    {PATCH_NOTES[noteIdx]}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button onClick={handlePlay} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold text-white hover:scale-105 transition-all" style={{ background: "linear-gradient(135deg,#10b981,#059669)", boxShadow: "0 0 16px rgba(16,185,129,0.4)" }}>
                    <Play size={13} fill="currentColor" /> Play 1.21.1
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border" style={{ background: btnBg, borderColor: border, color: titleText }}>
                    <FileText size={12} /> Full Patch Notes
                  </button>
                </div>
              </div>

              {/* Right Image */}
              <div className="relative md:w-1/2 min-h-[160px] md:min-h-full overflow-hidden">
                <img src="https://images.unsplash.com/photo-1629429407759-01cd3d7cfb38?w=800&h=400&fit=crop&auto=format" alt="Minecraft Artwork" className="w-full h-full object-cover" style={{ filter: dark ? "brightness(0.65) saturate(1.2)" : "brightness(0.85) saturate(1.1)" }} />
                <div className={`absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r ${dark ? "from-[#0c1322]" : "from-[#f1f5f9]"} via-transparent to-transparent`} />
                <div className="absolute top-3 right-4 flex items-center gap-1 text-[10px] text-emerald-500 font-bold z-10 px-2.5 py-1 rounded-full backdrop-blur-sm border border-emerald-500/30" style={{ background: dark ? "rgba(15,23,42,0.8)" : "rgba(255,255,255,0.9)" }}>
                  <CheckCircle size={10} /> Compatible with your mods
                </div>
              </div>
            </div>

            {/* 3-Column Responsive Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* News Card */}
              <div className="rounded-2xl overflow-hidden transition-all hover:scale-[1.01] cursor-pointer group border shadow-sm" style={{ background: cardBg, borderColor: border, backdropFilter: "blur(8px)" }}>
                <div className="relative h-32 overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=200&fit=crop&auto=format" alt="News" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-600 text-white tracking-wider">News</span>
                  <span className="absolute bottom-2 right-2.5 text-[9px] font-medium flex items-center gap-1 text-white bg-black/50 px-2 py-0.5 rounded backdrop-blur-sm"><Clock size={8} /> 3 days ago</span>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-sm mb-1.5 leading-snug" style={{ color: titleText }}>Mob Vote 2024: Armadillo Wins Community Poll</h3>
                  <p className="text-xs leading-relaxed mb-3 font-medium" style={{ color: subText }}>The Armadillo claimed 42% of votes. Now live in Minecraft 1.21 with Wolf Armor crafting.</p>
                  <span className="text-xs text-emerald-500 font-bold flex items-center gap-1 group-hover:gap-2 transition-all">Read more <ArrowRight size={11} /></span>
                </div>
              </div>

              {/* Fabric Card */}
              <div className="rounded-2xl overflow-hidden transition-all hover:scale-[1.01] cursor-pointer group border shadow-sm" style={{ background: cardBg, borderColor: border, backdropFilter: "blur(8px)" }}>
                <div className="relative h-32 overflow-hidden flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)" }}>
                  <div className="text-center z-10">
                    <div className="text-3xl mb-1">⚡</div>
                    <div className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">Fabric Loader</div>
                  </div>
                  <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 tracking-wider">Updated</span>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="font-bold text-sm" style={{ color: titleText }}>Fabric 0.15.11</h3>
                    <span className="text-xs font-mono font-medium" style={{ color: subText }}>mc1.21.1</span>
                  </div>
                  <p className="text-xs leading-relaxed mb-3 font-medium" style={{ color: subText }}>Improved 1.21.1 support, 18% faster mod loading, and 6 critical bug fixes.</p>
                  <span className="text-xs text-emerald-500 font-bold flex items-center gap-1">
                    <Download size={11} /> Install Fabric
                  </span>
                </div>
              </div>

              {/* Iris Shaders Card */}
              <div className="rounded-2xl overflow-hidden transition-all hover:scale-[1.01] cursor-pointer group md:col-span-2 lg:col-span-1 border shadow-sm" style={{ background: cardBg, borderColor: border, backdropFilter: "blur(8px)" }}>
                <div className="relative h-32 overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=200&fit=crop&auto=format" alt="Shaders" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-0.5 px-2 py-0.5 rounded bg-black/60 text-amber-400 text-xs font-bold backdrop-blur-sm">
                    <Star size={10} fill="currentColor" /> 4.9
                  </div>
                  <div className="absolute bottom-2 left-3 text-xs font-bold text-cyan-400 tracking-wider uppercase drop-shadow">✦ Iris Shaders</div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-sm mb-1.5" style={{ color: titleText }}>Complementary v5.3</h3>
                  <p className="text-xs leading-relaxed mb-3 font-medium" style={{ color: subText }}>Volumetric fog, PBR lighting, ray-traced reflections — runs at 90fps on RTX 4070.</p>
                  <span className="text-xs text-emerald-500 font-bold flex items-center gap-1"><Download size={11} /> Get Shaders Pack</span>
                </div>
              </div>
            </div>

            {/* Featured Servers Row */}
            <div className="rounded-2xl p-4 border shadow-sm" style={{ background: cardBg, borderColor: border, backdropFilter: "blur(8px)" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Server size={14} style={{ color: subText }} />
                  <span className="font-bold text-xs uppercase tracking-wider" style={{ color: titleText }}>Featured Servers</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> 3 / 3 online
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {SERVERS.map((s) => (
                  <div key={s.name} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:scale-[1.01] border" style={{ background: dark ? "rgba(15,23,42,0.5)" : "rgba(248,250,252,0.9)", borderColor: border }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: dark ? "rgba(30,41,59,0.8)" : "#e2e8f0" }}>{s.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs truncate" style={{ color: titleText }}>{s.name}</span>
                        <PingBar ping={s.ping} />
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] font-mono font-medium" style={{ color: subText }}>{s.address}</span>
                        <span className="text-[10px] font-semibold flex items-center gap-1" style={{ color: subText }}><Users size={9} />{s.players.toLocaleString()}</span>
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
          <div className="max-w-7xl mx-auto space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-xl font-bold" style={{ color: titleText }}>Mods & Modpacks Gallery</h2>
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-2.5" style={{ color: subText }} />
                <input type="text" placeholder="Search mods..." className="w-full pl-9 pr-3 py-2 rounded-xl text-xs font-semibold outline-none border" style={{ background: inputBg, borderColor: border, color: titleText }} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {MODS.map((m) => (
                <div key={m.name} className="p-4 rounded-xl flex items-center justify-between border shadow-sm" style={{ background: cardBg, borderColor: border, backdropFilter: "blur(8px)" }}>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm" style={{ color: titleText }}>{m.name}</h4>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase" style={{ background: `${m.color}22`, color: m.color }}>{m.tag}</span>
                    </div>
                    <p className="text-xs mt-1 font-medium" style={{ color: subText }}>by {m.author} • {m.dl} downloads</p>
                  </div>
                  <button className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md">
                    <Download size={12} /> Install
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── TAB: ACCOUNT ─── */}
        {activeTab === "account" && (
          <div className="max-w-2xl mx-auto space-y-5">
            <h2 className="text-xl font-bold" style={{ color: titleText }}>Account Settings</h2>
            {account && (
              <div className="p-5 rounded-2xl flex items-center justify-between border shadow-sm" style={{ background: cardBg, borderColor: border }}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl text-white font-bold flex items-center justify-center text-lg shadow-md" style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>
                    {account.username.substring(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-base" style={{ color: titleText }}>{account.username}</div>
                    <div className="text-xs text-emerald-500 font-bold flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> {account.account_type} Mode
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="p-5 rounded-2xl space-y-3 border shadow-sm" style={{ background: cardBg, borderColor: border }}>
              <h3 className="font-bold text-xs uppercase" style={{ color: subText }}>Change Offline Username</h3>
              <form onSubmit={handleSaveOfflineName} className="flex gap-2">
                <input type="text" value={offlineNameInput} onChange={(e) => setOfflineNameInput(e.target.value)} className="flex-1 p-2.5 rounded-xl text-xs font-mono outline-none border font-bold" style={{ background: inputBg, borderColor: border, color: titleText }} />
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white transition-colors shadow-md">Update</button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* ═══ BOTTOM ACTION BAR ═══ */}
      <footer className="relative z-20 flex flex-wrap items-center justify-between px-6 py-3 gap-4 flex-shrink-0 border-t backdrop-blur-xl transition-colors" style={{ borderColor: border, background: dark ? "rgba(15,23,42,0.92)" : "rgba(255,255,255,0.92)" }}>
        {/* Left: Account Selector */}
        <div onClick={() => setActiveTab("account")} className="flex items-center gap-3 px-3.5 py-2 rounded-xl cursor-pointer transition-all hover:scale-[1.01] border" style={{ background: btnBg, borderColor: border, minWidth: 170 }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white shadow-sm" style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>
            {account?.username ? account.username[0].toUpperCase() : "S"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-xs truncate" style={{ color: titleText }}>{account?.username || "Steve"}</div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-emerald-500 font-bold">{account?.account_type || "Offline"}</span>
            </div>
          </div>
          <ChevronDown size={12} style={{ color: subText }} />
        </div>

        {/* Center: Version Selector Dropdown */}
        <div className="flex items-center gap-2 flex-1 max-w-md" ref={dropRef}>
          <div className="relative flex-1">
            <button onClick={() => setVersionOpen(!versionOpen)} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs transition-all hover:scale-[1.01] border" style={{ background: btnBg, borderColor: border }}>
              <LoaderBadge loader={selectedVersion.loader} />
              <div className="flex-1 text-left">
                <div className="font-bold text-xs" style={{ color: titleText }}>{selectedVersion.label}</div>
                <div className="text-[9px] font-medium" style={{ color: subText }}>{selectedVersion.sub}</div>
              </div>
              <ChevronDown size={13} className={`transition-transform ${versionOpen ? "rotate-180" : ""}`} style={{ color: subText }} />
            </button>

            {versionOpen && (
              <div className="absolute bottom-full mb-2 left-0 right-0 rounded-xl overflow-hidden p-1 shadow-2xl z-50 backdrop-blur-xl border" style={{ background: dark ? "#18181b" : "#ffffff", borderColor: border }}>
                {VERSIONS.map((v) => (
                  <button key={v.id} onClick={() => { setSelectedVersion(v); setVersionOpen(false); }} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs text-left transition-colors ${selectedVersion.id === v.id ? "bg-emerald-500/15 text-emerald-500 font-bold" : "hover:bg-slate-500/10"}`} style={{ color: titleText }}>
                    <LoaderBadge loader={v.loader} />
                    <div>
                      <div className="font-bold">{v.label}</div>
                      <div className="text-[9px] font-medium" style={{ color: subText }}>{v.sub}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105 border" style={{ background: btnBg, borderColor: border, color: subText }}>
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Right: Quick Actions & PLAY Button */}
        <div className="flex items-center gap-2.5">
          <button onClick={handleOpenFolder} className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105 border" style={{ background: btnBg, borderColor: border, color: subText }} title="Open .minecraft">
            <Folder size={14} />
          </button>
          <button onClick={() => setIsSettingsOpen(true)} className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105 border" style={{ background: btnBg, borderColor: border, color: subText }} title="Settings">
            <Settings size={14} />
          </button>

          {/* PLAY Button */}
          <button disabled={isLaunching} onClick={handlePlay} className="flex items-center gap-3 px-7 rounded-xl font-bold transition-all duration-150 hover:scale-[1.03] active:scale-95 text-white" style={{ height: 46, background: "linear-gradient(135deg,#10b981 0%,#059669 50%,#047857 100%)", boxShadow: "0 0 28px rgba(16,185,129,0.5), 0 4px 14px rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.2)" }}>
            {isLaunching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play size={18} fill="currentColor" />}
            <div>
              <div className="text-base font-extrabold tracking-wider leading-none">PLAY</div>
              <div className="text-[8px] tracking-[0.15em] opacity-80 uppercase leading-none mt-0.5 font-medium">{isLaunching ? "Launching..." : "ENTER THE GAME"}</div>
            </div>
          </button>
        </div>
      </footer>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-2xl shadow-2xl p-5 space-y-4 border" style={{ background: dark ? "#0f172a" : "#ffffff", borderColor: border, color: titleText }}>
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: border }}>
              <h3 className="font-bold text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">MC</span>
                Launcher Settings
              </h3>
              <button onClick={() => setIsSettingsOpen(false)} className="hover:opacity-75" style={{ color: subText }}><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase" style={{ color: subText }}>Max RAM: {config.max_ram_mb} MB</label>
                <input type="range" min="1024" max="16384" step="512" value={config.max_ram_mb} onChange={(e) => setConfig({ ...config, max_ram_mb: Number(e.target.value) })} className="w-full accent-emerald-500 cursor-pointer mt-1" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase" style={{ color: subText }}>Java Path</label>
                <input type="text" value={config.java_path} onChange={(e) => setConfig({ ...config, java_path: e.target.value })} className="w-full p-2 mt-1 rounded-xl text-xs font-mono outline-none border font-bold" style={{ background: inputBg, borderColor: border, color: titleText }} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: border }}>
              <button onClick={() => setIsSettingsOpen(false)} className="px-3.5 py-1.5 rounded-xl text-xs font-bold border" style={{ background: btnBg, borderColor: border, color: titleText }}>Cancel</button>
              <button onClick={() => { invoke("update_config", { config }).catch(() => {}); setIsSettingsOpen(false); }} className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-md">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

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

/* ─── Types ─────────────────────────────────────────────────────────────── */
type Tab = "home" | "mods" | "account";
type Loader = "vanilla" | "fabric" | "forge" | "optifine";

interface VersionItem {
  id: string;
  label: string;
  sub: string;
  loader: Loader;
  versionStr: string;
}

/* ─── Data ───────────────────────────────────────────────────────────────── */
const VERSIONS: VersionItem[] = [
  { id: "1.21.1",          label: "1.21.1",         sub: "Tricky Trials",      loader: "vanilla",  versionStr: "1.21.1" },
  { id: "1.21.1-fabric",   label: "1.21.1 Fabric",  sub: "Loader 0.16.0",     loader: "fabric",   versionStr: "1.21.1" },
  { id: "1.20.4-forge",    label: "1.20.4 Forge",   sub: "49.0.30",            loader: "forge",    versionStr: "1.20.4" },
  { id: "1.20.1-optifine", label: "1.20.1 OptiFine",sub: "HD U I7 pre6",       loader: "optifine", versionStr: "1.20.1" },
  { id: "1.19.4",          label: "1.19.4",         sub: "Vanilla Standard",   loader: "vanilla",  versionStr: "1.19.4" },
];

const LOADER_META: Record<Loader, { emoji: string; color: string; bg: string; label: string }> = {
  vanilla:  { emoji: "📦", color: "#818cf8", bg: "rgba(99,102,241,0.15)",  label: "Vanilla"  },
  fabric:   { emoji: "⚡", color: "#fbbf24", bg: "rgba(251,191,36,0.15)",  label: "Fabric"   },
  forge:    { emoji: "🔨", color: "#f87171", bg: "rgba(248,113,113,0.15)", label: "Forge"    },
  optifine: { emoji: "🔍", color: "#22d3ee", bg: "rgba(34,211,238,0.15)",  label: "OptiFine" },
};

const SERVERS = [
  { name: "Hypixel",         address: "mc.hypixel.net",      ping: 34,  players: 87432, peak: 92100, icon: "⚔️",  tag: "Mini-Games"  },
  { name: "Complex Gaming",  address: "hub.mc-complex.com",  ping: 71,  players: 12904, peak: 18600, icon: "🏙️",  tag: "Survival"    },
  { name: "Mineplex",        address: "us.mineplex.com",     ping: 108, players: 4201,  peak: 7900,  icon: "🌐",  tag: "Arcade"      },
];

function PingBar({ ping }: { ping: number }) {
  const color = ping < 60 ? "#10b981" : ping < 100 ? "#fbbf24" : "#f87171";
  const bars = ping < 60 ? 3 : ping < 100 ? 2 : 1;
  return (
    <span className="inline-flex items-end gap-[2px]">
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          style={{
            display: "block",
            width: 3,
            height: 4 + i * 2,
            borderRadius: 1,
            background: i <= bars ? color : "rgba(100,116,139,0.3)",
          }}
        />
      ))}
      <span className="ml-1 font-mono text-[10px]" style={{ color, lineHeight: 1 }}>
        {ping}ms
      </span>
    </span>
  );
}

function LoaderIcon({ loader, size = 14 }: { loader: Loader; size?: number }) {
  const { emoji, color } = LOADER_META[loader] || LOADER_META.vanilla;
  return <span style={{ color, fontSize: size, lineHeight: 1 }}>{emoji}</span>;
}

const MODS = [
  { name: "Sodium",           author: "CaffeineMC",    dl: "4.2M",  version: "mc1.21.1-0.5.8", tag: "Performance", color: "#f59e0b" },
  { name: "Iris Shaders",     author: "coderbot",      dl: "3.8M",  version: "1.7.0+mc1.21",   tag: "Visual",      color: "#06b6d4" },
  { name: "Lithium",          author: "CaffeineMC",    dl: "2.9M",  version: "mc1.21-0.12.1",  tag: "Performance", color: "#10b981" },
  { name: "Create",           author: "simibubi",      dl: "8.1M",  version: "0.5.1-f-build.1408", tag: "Tech",    color: "#f97316" },
  { name: "Biomes O' Plenty", author: "Forstride",     dl: "6.4M",  version: "18.0.0.499",     tag: "World",       color: "#84cc16" },
  { name: "AppleSkin",        author: "squeek502",     dl: "5.0M",  version: "2.5.1+mc1.21",   tag: "HUD",         color: "#ec4899" },
];

export function App() {
  const scale = useScaleFit();
  const [dark, setDark] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [selectedVersion, setSelectedVersion] = useState(VERSIONS[0]);
  const [versionOpen, setVersionOpen] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const [offlineNameInput, setOfflineNameInput] = useState("Steve_MC_2026");

  const [account, setAccount] = useState<Account | null>({
    username: "Steve_MC_2026",
    uuid: "c0618b45-4202-3ac8-9f20-94d3fd4695ec",
    access_token: "offline_token",
    account_type: "Offline",
  });

  const [config, setConfig] = useState<AppConfig>({
    min_ram_mb: 1024,
    max_ram_mb: 4096,
    java_path: "java",
    resolution_width: 854,
    resolution_height: 480,
    jvm_args: "-XX:+UseG1GC",
    game_dir: "./.minecraft",
    theme: "dark",
  });

  useEffect(() => {
    invoke<AppConfig>("get_config")
      .then((cfg) => {
        if (cfg) {
          setConfig(cfg);
          setDark(cfg.theme === "dark");
        }
      })
      .catch(() => {});
  }, []);

  const handleToggleTheme = () => {
    const newDark = !dark;
    setDark(newDark);
    const updatedCfg = { ...config, theme: newDark ? ("dark" as const) : ("light" as const) };
    setConfig(updatedCfg);
    invoke("update_config", { config: updatedCfg }).catch(() => {});
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setVersionOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handlePlay = async () => {
    setIsLaunching(true);
    try {
      let activeAcc = account;
      if (!activeAcc) {
        activeAcc = await invoke<Account>("login_offline", { username: "Player" });
        setAccount(activeAcc);
      }

      let fullVersionId = selectedVersion.versionStr;
      if (selectedVersion.loader !== "vanilla") {
        fullVersionId = await invoke<string>("install_mod_loader_cmd", {
          gameDir: config.game_dir,
          gameVersion: selectedVersion.versionStr,
          loaderName: selectedVersion.loader,
          loaderVersion: "latest",
        });
      }

      await invoke<number>("launch_minecraft", {
        versionId: fullVersionId,
        account: activeAcc,
        config,
      });

      setTimeout(() => setIsLaunching(false), 2500);
    } catch (err: any) {
      setIsLaunching(false);
      alert("Khởi chạy game thất bại: " + (err?.message || err));
    }
  };

  const handleOpenFolder = () => {
    invoke("plugin:opener|open_path", { path: config.game_dir }).catch(() => {
      alert(`Đường dẫn game: ${config.game_dir}`);
    });
  };

  const handleSaveOfflineName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offlineNameInput.trim()) return;
    try {
      const acc = await invoke<Account>("login_offline", { username: offlineNameInput.trim() });
      setAccount(acc);
      alert("Đã cập nhật tên tài khoản Offline!");
    } catch (err: any) {
      alert("Lỗi tạo tài khoản: " + err);
    }
  };

  const bg     = dark ? "#0f172a" : "#f8fafc";
  const border = dark ? "#334155" : "#e2e8f0";
  const sub    = dark ? "#94a3b8" : "#64748b";

  const cardStyle = {
    background: dark ? "rgba(24,24,27,0.82)" : "rgba(255,255,255,0.85)",
    border: `1px solid ${border}`,
    backdropFilter: "blur(10px)",
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: dark ? "#020617" : "#cbd5e1",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: BASE_W,
          height: BASE_H,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          flexShrink: 0,
        }}
      >
        <div
          className="relative flex flex-col overflow-hidden shadow-2xl select-none"
          style={{
            width: BASE_W,
            height: BASE_H,
            background: bg,
            color: dark ? "#e2e8f0" : "#0f172a",
          }}
        >
          {/* Subtle background grid */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: dark
                ? `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(16,185,129,0.08) 0%, transparent 60%),
                   linear-gradient(rgba(51,65,85,0.3) 1px, transparent 1px),
                   linear-gradient(90deg, rgba(51,65,85,0.3) 1px, transparent 1px)`
                : `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(16,185,129,0.06) 0%, transparent 60%)`,
              backgroundSize: dark ? "100% 100%, 48px 48px, 48px 48px" : "100%",
            }}
          />

          {/* TOP NAVBAR */}
          <nav
            className="relative z-20 flex items-center px-5 flex-shrink-0"
            style={{
              height: 64,
              borderBottom: `1px solid ${border}`,
              background: dark ? "rgba(15,23,42,0.85)" : "rgba(255,255,255,0.85)",
              backdropFilter: "blur(12px)",
            }}
          >
            {/* Logo */}
            <div className="flex items-center gap-2.5 min-w-[180px]">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  boxShadow: "0 0 12px rgba(16,185,129,0.5)",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L3 7v10l9 5 9-5V7L12 2z" fill="rgba(255,255,255,0.9)" />
                  <path d="M12 2L3 7l9 5 9-5L12 2z" fill="rgba(255,255,255,0.4)" />
                </svg>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-tight text-base font-rajdhani">
                  MCLauncher
                </span>
                <div
                  className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-bold"
                  style={{
                    background: "linear-gradient(135deg, #10b981, #059669)",
                    color: "#fff",
                    fontSize: 9,
                    boxShadow: "0 0 8px rgba(16,185,129,0.4)",
                  }}
                >
                  <Shield size={8} />
                  PRO
                </div>
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
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
                  style={{
                    background: activeTab === id ? (dark ? "rgba(16,185,129,0.15)" : "rgba(16,185,129,0.1)") : "transparent",
                    color: activeTab === id ? "#10b981" : sub,
                    borderBottom: activeTab === id ? "2px solid #10b981" : "2px solid transparent",
                    borderRadius: "8px 8px 0 0",
                  }}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2 min-w-[180px] justify-end">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
                style={{
                  background: dark ? "rgba(51,65,85,0.5)" : "rgba(226,232,240,0.7)",
                  color: sub,
                }}
              >
                <Settings size={15} />
              </button>
              {/* Dark/Light toggle */}
              <button
                onClick={handleToggleTheme}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                style={{
                  background: dark ? "rgba(51,65,85,0.5)" : "rgba(226,232,240,0.7)",
                  color: sub,
                }}
              >
                {dark ? <Moon size={13} /> : <Sun size={13} />}
                <div
                  className="relative w-8 h-4 rounded-full transition-all duration-200"
                  style={{ background: dark ? "#10b981" : "#cbd5e1" }}
                >
                  <div
                    className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all duration-200"
                    style={{ left: dark ? "calc(100% - 14px)" : "2px" }}
                  />
                </div>
              </button>
            </div>
          </nav>

          {/* MAIN CONTENT AREA */}
          <div className="flex-1 overflow-y-auto relative z-10">
            {activeTab === "home" && (
              <div className="px-5 py-4 space-y-4">
                {/* Hero Banner */}
                <div className="relative rounded-2xl overflow-hidden flex-shrink-0" style={{ height: 200 }}>
                  <img
                    src="https://images.unsplash.com/photo-1629429407759-01cd3d7cfb38?w=1024&h=220&fit=crop&auto=format"
                    alt="Minecraft Tricky Trials gameplay"
                    className="w-full h-full object-cover"
                    style={{ filter: "brightness(0.55) saturate(1.2)" }}
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background: "linear-gradient(90deg, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.6) 50%, transparent 100%)",
                    }}
                  />
                  <div className="absolute inset-0 flex flex-col justify-between p-5">
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-widest font-rajdhani"
                        style={{
                          background: "linear-gradient(135deg, #10b981, #059669)",
                          color: "#fff",
                          boxShadow: "0 0 10px rgba(16,185,129,0.5)",
                        }}
                      >
                        Latest Release
                      </span>
                      <span className="text-xs text-slate-400">
                        <Clock size={10} className="inline mr-1" />
                        Released Jul 12, 2024
                      </span>
                    </div>
                    <div>
                      <h1 className="font-bold mb-1 font-rajdhani text-2xl text-white leading-tight">
                        Minecraft 1.21.1 <span style={{ color: "#10b981" }}>Tricky Trials Update</span>
                      </h1>
                      <p className="text-xs mb-3 text-slate-300 max-w-sm">
                        New Trial Chambers, the Mace weapon, Wind Charges, Breeze mobs, and copper structures await.
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handlePlay}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-extrabold text-white transition-all hover:scale-105 font-rajdhani"
                          style={{
                            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                            boxShadow: "0 0 20px rgba(16,185,129,0.45)",
                          }}
                        >
                          <Play size={13} fill="currentColor" />
                          Play 1.21.1
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3-Column Cards Grid */}
                <div className="grid grid-cols-3 gap-3">
                  {/* News Card */}
                  <div className="rounded-2xl overflow-hidden cursor-pointer transition-all hover:scale-[1.02]" style={cardStyle}>
                    <div className="relative h-28 bg-slate-800 overflow-hidden">
                      <img
                        src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=120&fit=crop&auto=format"
                        alt="Minecraft news"
                        className="w-full h-full object-cover opacity-70"
                      />
                      <div className="absolute top-2 left-2">
                        <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-indigo-600 text-white">
                          NEWS
                        </span>
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-bold text-sm mb-1 leading-tight font-rajdhani">
                        Mob Vote 2024 Results Announced
                      </h3>
                      <p className="text-xs text-slate-400">The Armadillo won the community vote and is live in 1.21.</p>
                    </div>
                  </div>

                  {/* Fabric Card */}
                  <div className="rounded-2xl overflow-hidden cursor-pointer transition-all hover:scale-[1.02]" style={cardStyle}>
                    <div className="h-28 flex items-center justify-center bg-indigo-950">
                      <div className="text-center">
                        <div className="text-3xl mb-1">⚡</div>
                        <div className="text-xs font-bold tracking-widest uppercase text-amber-400 font-rajdhani">
                          Fabric Loader
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-sm font-rajdhani">Fabric 0.15.11</h3>
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-400 font-bold">
                          Updated
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">Now supports 1.21.1 with improved mod compatibility.</p>
                    </div>
                  </div>

                  {/* Iris Shaders Card */}
                  <div className="rounded-2xl overflow-hidden cursor-pointer transition-all hover:scale-[1.02]" style={cardStyle}>
                    <div className="relative h-28 overflow-hidden">
                      <img
                        src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=120&fit=crop&auto=format"
                        alt="Iris shaders"
                        className="w-full h-full object-cover opacity-80"
                      />
                      <div className="absolute bottom-2 left-3 font-bold text-xs text-cyan-400 font-rajdhani">
                        ✦ IRIS SHADERS
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold font-rajdhani">Complementary v5.3</h3>
                        <div className="flex items-center gap-0.5 text-amber-400 text-xs">
                          <Star size={9} fill="currentColor" /> 4.9
                        </div>
                      </div>
                      <p className="text-xs text-slate-400">Volumetric clouds, PBR lighting & reflections.</p>
                    </div>
                  </div>
                </div>

                {/* Featured Servers Bar */}
                <div className="rounded-2xl p-3" style={cardStyle}>
                  <div className="flex items-center justify-between mb-2.5">
                    <h3 className="font-bold text-xs tracking-wider uppercase font-rajdhani text-slate-300">
                      FEATURED SERVERS
                    </h3>
                    <span className="text-xs text-slate-400">3 online</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {SERVERS.map((server) => (
                      <div
                        key={server.name}
                        className="flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer transition-all hover:scale-[1.02]"
                        style={{
                          background: dark ? "rgba(15,23,42,0.6)" : "rgba(248,250,252,0.8)",
                          border: `1px solid ${dark ? "rgba(51,65,85,0.5)" : "#e2e8f0"}`,
                        }}
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-base">
                          {server.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs truncate font-rajdhani">{server.name}</span>
                            <PingBar ping={server.ping} />
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <Users size={9} />
                            <span>{server.players.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: MODS & PACKS */}
            {activeTab === "mods" && (
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold font-rajdhani">Mods & Modpacks Gallery</h2>
                  <div className="relative w-64">
                    <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search mods..."
                      className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold outline-none focus:border-emerald-500 text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {MODS.map((m) => (
                    <div key={m.name} className="p-3.5 rounded-xl border flex items-center justify-between" style={cardStyle}>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm font-rajdhani">{m.name}</h4>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase" style={{ background: `${m.color}22`, color: m.color }}>
                            {m.tag}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">by {m.author} • {m.dl} downloads</p>
                      </div>
                      <button className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1">
                        <Download size={11} /> Install
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: ACCOUNT MANAGEMENT */}
            {activeTab === "account" && (
              <div className="p-5 space-y-4 max-w-xl mx-auto">
                <h2 className="text-xl font-bold font-rajdhani">Account Settings</h2>
                {account && (
                  <div className="p-4 rounded-xl border flex items-center justify-between" style={cardStyle}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-base font-rajdhani">
                        {account.username.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-sm font-rajdhani">{account.username}</div>
                        <div className="text-xs text-emerald-400 font-semibold">{account.account_type} Mode</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-4 rounded-xl border space-y-3" style={cardStyle}>
                  <h3 className="font-bold text-xs uppercase text-slate-300">Change Offline Username</h3>
                  <form onSubmit={handleSaveOfflineName} className="flex gap-2">
                    <input
                      type="text"
                      value={offlineNameInput}
                      onChange={(e) => setOfflineNameInput(e.target.value)}
                      className="flex-1 p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-100 outline-none focus:border-emerald-500"
                    />
                    <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white">
                      Update
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>

          {/* STICKY BOTTOM ACTION BAR */}
          <div
            className="relative z-20 flex items-center px-5 gap-3 flex-shrink-0"
            style={{
              height: 80,
              borderTop: `1px solid ${border}`,
              background: dark ? "rgba(15,23,42,0.9)" : "rgba(255,255,255,0.9)",
              backdropFilter: "blur(16px)",
            }}
          >
            {/* Account Selector */}
            <div
              onClick={() => setActiveTab("account")}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02]"
              style={{
                background: dark ? "rgba(30,41,59,0.7)" : "rgba(248,250,252,0.9)",
                border: `1px solid ${border}`,
                minWidth: 180,
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 text-white font-rajdhani"
                style={{
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  boxShadow: "0 0 10px rgba(16,185,129,0.3)",
                }}
              >
                {account?.username ? account.username.substring(0, 2).toUpperCase() : "ST"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-xs truncate font-rajdhani">{account?.username || "Steve"}</div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-emerald-400 font-semibold">{account?.account_type || "Offline"}</span>
                </div>
              </div>
              <ChevronDown size={12} style={{ color: "#64748b" }} />
            </div>

            {/* Version Dropdown Selector */}
            <div className="flex-1 flex items-center justify-center gap-2" ref={dropRef}>
              <div className="relative">
                <button
                  onClick={() => setVersionOpen(!versionOpen)}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 hover:scale-[1.02]"
                  style={{
                    background: dark ? "rgba(30,41,59,0.7)" : "rgba(248,250,252,0.9)",
                    border: `1px solid ${border}`,
                    minWidth: 240,
                  }}
                >
                  <LoaderIcon loader={selectedVersion.loader} size={15} />
                  <span className="flex-1 text-left font-mono truncate">{selectedVersion.label} — {selectedVersion.sub}</span>
                  <ChevronDown size={13} className={`text-slate-400 transition-transform ${versionOpen ? "rotate-180" : ""}`} />
                </button>

                {versionOpen && (
                  <div
                    className="absolute bottom-full mb-2 left-0 right-0 rounded-xl overflow-hidden p-1 shadow-2xl z-50"
                    style={{
                      background: dark ? "#18181b" : "#ffffff",
                      border: `1px solid ${border}`,
                    }}
                  >
                    {VERSIONS.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => {
                          setSelectedVersion(v);
                          setVersionOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-mono text-left transition-colors ${
                          selectedVersion.id === v.id
                            ? "bg-emerald-500/20 text-emerald-400 font-bold"
                            : "hover:bg-slate-800/50 text-slate-300"
                        }`}
                      >
                        <LoaderIcon loader={v.loader} size={13} />
                        <span>{v.label} — {v.sub}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => {}}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                style={{
                  background: dark ? "rgba(30,41,59,0.7)" : "rgba(248,250,252,0.9)",
                  border: `1px solid ${border}`,
                  color: "#64748b",
                }}
              >
                <RefreshCw size={14} />
              </button>
            </div>

            {/* Right Quick Actions & PLAY BUTTON */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenFolder}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                style={{
                  background: dark ? "rgba(30,41,59,0.7)" : "rgba(248,250,252,0.9)",
                  border: `1px solid ${border}`,
                  color: "#64748b",
                }}
                title="Mở thư mục .minecraft"
              >
                <Folder size={14} />
              </button>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                style={{
                  background: dark ? "rgba(30,41,59,0.7)" : "rgba(248,250,252,0.9)",
                  border: `1px solid ${border}`,
                  color: "#64748b",
                }}
                title="Cấu hình Launcher"
              >
                <Settings size={14} />
              </button>

              {/* Iconic PLAY BUTTON */}
              <button
                disabled={isLaunching}
                onClick={handlePlay}
                className="flex items-center gap-2 px-6 rounded-xl font-bold transition-all duration-150 font-rajdhani"
                style={{
                  height: 50,
                  fontSize: 17,
                  letterSpacing: "0.1em",
                  background: "linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)",
                  color: "#fff",
                  boxShadow: "0 0 30px rgba(16,185,129,0.5), 0 4px 16px rgba(0,0,0,0.3)",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              >
                {isLaunching ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Play size={18} fill="currentColor" />
                )}
                <div>
                  <div>PLAY</div>
                  <div style={{ fontSize: 9, letterSpacing: "0.15em", opacity: 0.8, lineHeight: 1, fontWeight: 500 }}>
                    {isLaunching ? "Launching..." : "ENTER THE GAME"}
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150 font-sans">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-5 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <span className="w-7 h-7 rounded-xl bg-emerald-500 text-white font-black text-xs flex items-center justify-center font-rajdhani">
                  MC
                </span>
                <h3 className="font-extrabold text-base font-rajdhani">Launcher Settings</h3>
              </div>
              <button onClick={() => setIsSettingsOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Max RAM Allocation: {config.max_ram_mb} MB</label>
                <input
                  type="range"
                  min="1024"
                  max="16384"
                  step="512"
                  value={config.max_ram_mb}
                  onChange={(e) => setConfig({ ...config, max_ram_mb: Number(e.target.value) })}
                  className="w-full accent-emerald-500 cursor-pointer mt-2"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Java Executable Path</label>
                <input
                  type="text"
                  value={config.java_path}
                  onChange={(e) => setConfig({ ...config, java_path: e.target.value })}
                  className="w-full p-3 mt-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-300"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  invoke("update_config", { config }).catch(() => {});
                  setIsSettingsOpen(false);
                }}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 font-extrabold text-xs text-white shadow-lg shadow-emerald-600/20"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

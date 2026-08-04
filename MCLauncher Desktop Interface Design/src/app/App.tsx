import { useState } from "react";
import {
  Shield,
  Settings,
  Sun,
  Moon,
  ChevronDown,
  RefreshCw,
  Folder,
  Play,
  Wifi,
  Users,
  Package,
  Zap,
  Hammer,
  Search,
  Newspaper,
  Layers,
  User,
  ExternalLink,
  Star,
  Clock,
  Download,
} from "lucide-react";

type Tab = "home" | "mods" | "account";
type Loader = "vanilla" | "fabric" | "forge" | "optifine";

const VERSIONS: { id: string; label: string; loader: Loader }[] = [
  { id: "1.21.1", label: "1.21.1 — Tricky Trials", loader: "vanilla" },
  { id: "1.21.1-fabric", label: "1.21.1 — Fabric 0.15.11", loader: "fabric" },
  { id: "1.20.4-forge", label: "1.20.4 — Forge 49.0.30", loader: "forge" },
  { id: "1.20.1-optifine", label: "1.20.1 — OptiFine HD U I7", loader: "optifine" },
  { id: "1.19.4", label: "1.19.4 — Vanilla", loader: "vanilla" },
];

const LOADER_ICON: Record<Loader, { icon: React.ElementType; color: string; label: string }> = {
  vanilla: { icon: Package, color: "#6366f1", label: "Vanilla" },
  fabric: { icon: Zap, color: "#f59e0b", label: "Fabric" },
  forge: { icon: Hammer, color: "#ef4444", label: "Forge" },
  optifine: { icon: Search, color: "#06b6d4", label: "OptiFine" },
};

const SERVERS = [
  { name: "Hypixel", address: "mc.hypixel.net", ping: 42, players: 87432, online: true, icon: "⚔️" },
  { name: "Complex Gaming", address: "hub.mc-complex.com", ping: 78, players: 12904, online: true, icon: "🏙️" },
  { name: "Mineplex", address: "us.mineplex.com", ping: 112, players: 4201, online: true, icon: "🌐" },
];

function LoaderIcon({ loader, size = 14 }: { loader: Loader; size?: number }) {
  const { icon: Icon, color } = LOADER_ICON[loader];
  return <Icon size={size} style={{ color }} />;
}

function PingDot({ ping }: { ping: number }) {
  const color = ping < 60 ? "#10b981" : ping < 120 ? "#f59e0b" : "#ef4444";
  return (
    <span className="inline-flex items-center gap-1 text-xs font-mono" style={{ color }}>
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: color }} />
      {ping}ms
    </span>
  );
}

export default function App() {
  const [dark, setDark] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [selectedVersion, setSelectedVersion] = useState(VERSIONS[0]);
  const [versionOpen, setVersionOpen] = useState(false);
  const [playPressed, setPlayPressed] = useState(false);
  const [account] = useState({ name: "Steve_MC_2024", type: "Microsoft", avatar: "S" });

  const root = dark ? "dark" : "";

  const handlePlay = () => {
    setPlayPressed(true);
    setTimeout(() => setPlayPressed(false), 200);
  };

  return (
    <div className={root} style={{ width: 1024, height: 640, fontFamily: "'Inter', sans-serif" }}>
      <div
        className="relative flex flex-col overflow-hidden"
        style={{
          width: 1024,
          height: 640,
          background: dark ? "#0f172a" : "#f8fafc",
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
            borderBottom: `1px solid ${dark ? "#334155" : "#e2e8f0"}`,
            background: dark
              ? "rgba(15,23,42,0.85)"
              : "rgba(255,255,255,0.85)",
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
              <span
                className="font-bold tracking-tight text-base"
                style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.02em" }}
              >
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
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  background:
                    activeTab === id
                      ? dark ? "rgba(16,185,129,0.15)" : "rgba(16,185,129,0.1)"
                      : "transparent",
                  color:
                    activeTab === id
                      ? "#10b981"
                      : dark ? "#94a3b8" : "#64748b",
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
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
              style={{
                background: dark ? "rgba(51,65,85,0.5)" : "rgba(226,232,240,0.7)",
                color: dark ? "#94a3b8" : "#64748b",
              }}
            >
              <Settings size={15} />
            </button>
            {/* Dark/Light toggle */}
            <button
              onClick={() => setDark(!dark)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
              style={{
                background: dark ? "rgba(51,65,85,0.5)" : "rgba(226,232,240,0.7)",
                color: dark ? "#94a3b8" : "#64748b",
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

        {/* MAIN CONTENT — scrollable */}
        <div
          className="flex-1 overflow-y-auto relative z-10"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          <style>{`div::-webkit-scrollbar { display: none; }`}</style>

          {activeTab === "home" && (
            <div className="px-5 py-4 space-y-4">
              {/* Hero Banner */}
              <div
                className="relative rounded-2xl overflow-hidden flex-shrink-0"
                style={{ height: 200 }}
              >
                <img
                  src="https://images.unsplash.com/photo-1629429407759-01cd3d7cfb38?w=1024&h=220&fit=crop&auto=format"
                  alt="Minecraft Tricky Trials gameplay"
                  className="w-full h-full object-cover"
                  style={{ filter: "brightness(0.55) saturate(1.2)" }}
                />
                {/* Gradient overlay */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.6) 50%, transparent 100%)",
                  }}
                />
                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-between p-5">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-widest"
                      style={{
                        background: "linear-gradient(135deg, #10b981, #059669)",
                        color: "#fff",
                        boxShadow: "0 0 10px rgba(16,185,129,0.5)",
                        fontFamily: "'Rajdhani', sans-serif",
                      }}
                    >
                      Latest Release
                    </span>
                    <span className="text-xs" style={{ color: "#64748b" }}>
                      <Clock size={10} className="inline mr-1" />
                      Released Jul 12, 2024
                    </span>
                  </div>
                  <div>
                    <h1
                      className="font-bold mb-1"
                      style={{
                        fontFamily: "'Rajdhani', sans-serif",
                        fontSize: 26,
                        lineHeight: 1.1,
                        color: "#fff",
                        textShadow: "0 2px 12px rgba(0,0,0,0.5)",
                      }}
                    >
                      Minecraft 1.21.1
                      <br />
                      <span style={{ color: "#10b981" }}>Tricky Trials Update</span>
                    </h1>
                    <p className="text-xs mb-3" style={{ color: "#94a3b8", maxWidth: 340 }}>
                      New Trial Chambers, the Mace weapon, Wind Charges, Breeze mobs, and copper-themed structures await.
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105"
                        style={{
                          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                          color: "#fff",
                          boxShadow: "0 0 20px rgba(16,185,129,0.45), 0 4px 12px rgba(0,0,0,0.3)",
                          fontFamily: "'Rajdhani', sans-serif",
                          letterSpacing: "0.04em",
                        }}
                      >
                        <Play size={13} fill="currentColor" />
                        Play 1.21.1
                      </button>
                      <button
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
                        style={{
                          background: "rgba(255,255,255,0.08)",
                          color: "#e2e8f0",
                          border: "1px solid rgba(255,255,255,0.12)",
                          backdropFilter: "blur(6px)",
                        }}
                      >
                        <ExternalLink size={11} />
                        Patch Notes
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3-Column Cards */}
              <div className="grid grid-cols-3 gap-3">
                {/* News Card */}
                <div
                  className="rounded-2xl overflow-hidden transition-all duration-200 hover:scale-[1.02] cursor-pointer"
                  style={{
                    background: dark ? "rgba(24,24,27,0.8)" : "rgba(255,255,255,0.8)",
                    border: `1px solid ${dark ? "#334155" : "#e2e8f0"}`,
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <div className="relative h-28 bg-slate-800 overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=120&fit=crop&auto=format"
                      alt="Minecraft news"
                      className="w-full h-full object-cover opacity-70"
                    />
                    <div className="absolute top-2 left-2">
                      <span
                        className="px-1.5 py-0.5 rounded text-xs font-bold"
                        style={{ background: "#6366f1", color: "#fff", fontSize: 9 }}
                      >
                        NEWS
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3
                      className="font-semibold text-sm mb-1 leading-tight"
                      style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 15 }}
                    >
                      Mob Vote 2024 Results Announced
                    </h3>
                    <p className="text-xs leading-relaxed" style={{ color: dark ? "#64748b" : "#94a3b8" }}>
                      The Armadillo won the community vote and is now live in 1.21.
                    </p>
                    <div className="flex items-center gap-1 mt-2" style={{ color: "#64748b" }}>
                      <Clock size={9} />
                      <span className="text-xs">3 days ago</span>
                    </div>
                  </div>
                </div>

                {/* Fabric Card */}
                <div
                  className="rounded-2xl overflow-hidden transition-all duration-200 hover:scale-[1.02] cursor-pointer"
                  style={{
                    background: dark ? "rgba(24,24,27,0.8)" : "rgba(255,255,255,0.8)",
                    border: `1px solid ${dark ? "#334155" : "#e2e8f0"}`,
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <div
                    className="h-28 flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
                    }}
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-1">⚡</div>
                      <div
                        className="text-xs font-bold tracking-widest uppercase"
                        style={{ color: "#a5b4fc", fontFamily: "'Rajdhani', sans-serif" }}
                      >
                        Fabric Loader
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <h3
                        className="font-semibold text-sm leading-tight"
                        style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 15 }}
                      >
                        Fabric 0.15.11
                      </h3>
                      <span
                        className="px-1.5 py-0.5 rounded text-xs"
                        style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", fontSize: 9 }}
                      >
                        Updated
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: dark ? "#64748b" : "#94a3b8" }}>
                      Now supports 1.21.1 with improved mod compatibility and faster load times.
                    </p>
                    <button
                      className="mt-2 flex items-center gap-1 text-xs font-medium"
                      style={{ color: "#f59e0b" }}
                    >
                      <Download size={10} /> Install Fabric
                    </button>
                  </div>
                </div>

                {/* Iris Shaders Card */}
                <div
                  className="rounded-2xl overflow-hidden transition-all duration-200 hover:scale-[1.02] cursor-pointer"
                  style={{
                    background: dark ? "rgba(24,24,27,0.8)" : "rgba(255,255,255,0.8)",
                    border: `1px solid ${dark ? "#334155" : "#e2e8f0"}`,
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <div className="relative h-28 overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=120&fit=crop&auto=format"
                      alt="Iris shaders landscape"
                      className="w-full h-full object-cover"
                      style={{ filter: "brightness(0.6) saturate(1.5)" }}
                    />
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(to bottom, transparent 40%, rgba(24,24,27,0.9) 100%)",
                      }}
                    />
                    <div className="absolute bottom-2 left-3">
                      <span
                        className="text-xs font-bold"
                        style={{ color: "#06b6d4", fontFamily: "'Rajdhani', sans-serif" }}
                      >
                        ✦ IRIS SHADERS
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <h3
                        className="font-semibold leading-tight"
                        style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 15 }}
                      >
                        Complementary v5.3
                      </h3>
                      <div className="flex items-center gap-0.5" style={{ color: "#f59e0b" }}>
                        <Star size={9} fill="currentColor" />
                        <span className="text-xs">4.9</span>
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: dark ? "#64748b" : "#94a3b8" }}>
                      Volumetric clouds, PBR lighting, and ray-traced reflections for 1.21.
                    </p>
                    <button
                      className="mt-2 flex items-center gap-1 text-xs font-medium"
                      style={{ color: "#06b6d4" }}
                    >
                      <Download size={10} /> Get Shaders
                    </button>
                  </div>
                </div>
              </div>

              {/* Featured Servers Bar */}
              <div
                className="rounded-2xl p-3"
                style={{
                  background: dark ? "rgba(24,24,27,0.8)" : "rgba(255,255,255,0.8)",
                  border: `1px solid ${dark ? "#334155" : "#e2e8f0"}`,
                  backdropFilter: "blur(8px)",
                }}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <h3
                    className="font-semibold text-sm"
                    style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 14, letterSpacing: "0.05em" }}
                  >
                    FEATURED SERVERS
                  </h3>
                  <span className="text-xs" style={{ color: "#64748b" }}>
                    {SERVERS.filter((s) => s.online).length} online
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {SERVERS.map((server) => (
                    <div
                      key={server.name}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                      style={{
                        background: dark ? "rgba(15,23,42,0.6)" : "rgba(248,250,252,0.8)",
                        border: `1px solid ${dark ? "rgba(51,65,85,0.5)" : "#e2e8f0"}`,
                      }}
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-lg"
                        style={{ background: dark ? "#1e293b" : "#f1f5f9" }}
                      >
                        {server.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs truncate" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 13 }}>
                            {server.name}
                          </span>
                          <PingDot ping={server.ping} />
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Users size={9} style={{ color: "#64748b" }} />
                          <span className="text-xs" style={{ color: "#64748b", fontFamily: "'JetBrains Mono', monospace" }}>
                            {server.players.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "mods" && (
            <div className="flex items-center justify-center h-full" style={{ color: "#64748b" }}>
              <div className="text-center">
                <Layers size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Mods & Packs coming soon</p>
              </div>
            </div>
          )}

          {activeTab === "account" && (
            <div className="flex items-center justify-center h-full" style={{ color: "#64748b" }}>
              <div className="text-center">
                <User size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Account management coming soon</p>
              </div>
            </div>
          )}
        </div>

        {/* STICKY BOTTOM ACTION BAR */}
        <div
          className="relative z-20 flex items-center px-5 gap-3 flex-shrink-0"
          style={{
            height: 80,
            borderTop: `1px solid ${dark ? "#334155" : "#e2e8f0"}`,
            background: dark
              ? "rgba(15,23,42,0.9)"
              : "rgba(255,255,255,0.9)",
            backdropFilter: "blur(16px)",
          }}
        >
          {/* Account Selector */}
          <div
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02]"
            style={{
              background: dark ? "rgba(30,41,59,0.7)" : "rgba(248,250,252,0.9)",
              border: `1px solid ${dark ? "#334155" : "#e2e8f0"}`,
              minWidth: 180,
            }}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #10b981, #059669)",
                color: "#fff",
                boxShadow: "0 0 10px rgba(16,185,129,0.3)",
              }}
            >
              {account.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-xs truncate" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 13 }}>
                {account.name}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: "#10b981", boxShadow: "0 0 4px #10b981" }}
                />
                <span className="text-xs" style={{ color: "#10b981", fontSize: 10 }}>
                  {account.type}
                </span>
              </div>
            </div>
            <ChevronDown size={12} style={{ color: "#64748b" }} />
          </div>

          {/* Version Dropdown — center */}
          <div className="flex-1 flex items-center justify-center gap-2">
            <div className="relative">
              <button
                onClick={() => setVersionOpen(!versionOpen)}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 hover:scale-[1.02]"
                style={{
                  background: dark ? "rgba(30,41,59,0.7)" : "rgba(248,250,252,0.9)",
                  border: `1px solid ${dark ? "#334155" : "#e2e8f0"}`,
                  minWidth: 240,
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                <LoaderIcon loader={selectedVersion.loader} size={15} />
                <span className="flex-1 text-left text-xs truncate" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                  {selectedVersion.label}
                </span>
                <ChevronDown
                  size={13}
                  style={{
                    color: "#64748b",
                    transition: "transform 0.2s",
                    transform: versionOpen ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                />
              </button>
              {/* Dropdown menu */}
              {versionOpen && (
                <div
                  className="absolute bottom-full mb-2 left-0 right-0 rounded-xl overflow-hidden"
                  style={{
                    background: dark ? "#18181b" : "#ffffff",
                    border: `1px solid ${dark ? "#334155" : "#e2e8f0"}`,
                    boxShadow: "0 -8px 32px rgba(0,0,0,0.3)",
                    zIndex: 50,
                  }}
                >
                  {VERSIONS.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => { setSelectedVersion(v); setVersionOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-xs transition-all duration-150"
                      style={{
                        background:
                          selectedVersion.id === v.id
                            ? dark ? "rgba(16,185,129,0.12)" : "rgba(16,185,129,0.08)"
                            : "transparent",
                        color: selectedVersion.id === v.id ? "#10b981" : (dark ? "#e2e8f0" : "#0f172a"),
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                      onMouseEnter={(e) => {
                        if (selectedVersion.id !== v.id)
                          (e.currentTarget as HTMLButtonElement).style.background = dark ? "rgba(51,65,85,0.4)" : "rgba(241,245,249,0.8)";
                      }}
                      onMouseLeave={(e) => {
                        if (selectedVersion.id !== v.id)
                          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                      }}
                    >
                      <LoaderIcon loader={v.loader} size={13} />
                      {v.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110"
              style={{
                background: dark ? "rgba(30,41,59,0.7)" : "rgba(248,250,252,0.9)",
                border: `1px solid ${dark ? "#334155" : "#e2e8f0"}`,
                color: "#64748b",
              }}
            >
              <RefreshCw size={14} />
            </button>
          </div>

          {/* Right: Quick actions + Play button */}
          <div className="flex items-center gap-2">
            <button
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110"
              style={{
                background: dark ? "rgba(30,41,59,0.7)" : "rgba(248,250,252,0.9)",
                border: `1px solid ${dark ? "#334155" : "#e2e8f0"}`,
                color: "#64748b",
              }}
              title="Open .minecraft folder"
            >
              <Folder size={14} />
            </button>
            <button
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110"
              style={{
                background: dark ? "rgba(30,41,59,0.7)" : "rgba(248,250,252,0.9)",
                border: `1px solid ${dark ? "#334155" : "#e2e8f0"}`,
                color: "#64748b",
              }}
              title="Launch settings"
            >
              <Settings size={14} />
            </button>

            {/* PLAY BUTTON */}
            <button
              onClick={handlePlay}
              className="flex items-center gap-2 px-6 rounded-xl font-bold transition-all duration-150"
              style={{
                height: 50,
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: 17,
                letterSpacing: "0.1em",
                background: playPressed
                  ? "linear-gradient(135deg, #059669 0%, #047857 100%)"
                  : "linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)",
                color: "#fff",
                boxShadow: playPressed
                  ? "0 2px 8px rgba(16,185,129,0.3), inset 0 2px 4px rgba(0,0,0,0.2)"
                  : "0 0 30px rgba(16,185,129,0.5), 0 0 60px rgba(16,185,129,0.2), 0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.25)",
                border: "1px solid rgba(255,255,255,0.15)",
                transform: playPressed ? "scale(0.97) translateY(1px)" : "scale(1)",
              }}
            >
              <Play size={18} fill="currentColor" style={{ filter: "drop-shadow(0 0 4px rgba(255,255,255,0.4))" }} />
              <div>
                <div>PLAY</div>
                <div style={{ fontSize: 9, letterSpacing: "0.15em", opacity: 0.8, lineHeight: 1, fontWeight: 500 }}>
                  ENTER THE GAME
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

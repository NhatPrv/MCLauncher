import { useState, useEffect } from "react";
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
  Package,
  Zap,
  Hammer,
  Search,
  Newspaper,
  Layers,
  User,
  Star,
  Clock,
  Download,
  Loader2,
  CheckCircle,
  X,
} from "lucide-react";
import { Account, AppConfig } from "./types";
import { invoke } from "@tauri-apps/api/core";

type Tab = "home" | "mods" | "account";
type Loader = "vanilla" | "fabric" | "forge" | "optifine";

interface VersionItem {
  id: string;
  label: string;
  loader: Loader;
  versionStr: string;
}

const VERSIONS: VersionItem[] = [
  { id: "1.21.1", label: "1.21.1 — Tricky Trials", loader: "vanilla", versionStr: "1.21.1" },
  { id: "1.21.1-fabric", label: "1.21.1 — Fabric 0.15.11", loader: "fabric", versionStr: "1.21.1" },
  { id: "1.20.4-forge", label: "1.20.4 — Forge 49.0.30", loader: "forge", versionStr: "1.20.4" },
  { id: "1.20.1-optifine", label: "1.20.1 — OptiFine HD U I7", loader: "optifine", versionStr: "1.20.1" },
  { id: "1.19.4", label: "1.19.4 — Vanilla Standard", loader: "vanilla", versionStr: "1.19.4" },
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

const MODPACKS = [
  { id: 1, name: "Sodium FPS Booster", category: "Mods", downloads: "24.5M", rating: 4.9, icon: "⚡", desc: "Tối ưu hóa render engine gia tăng FPS tối đa." },
  { id: 2, name: "Iris Shaders", category: "Shaders", downloads: "18.2M", rating: 4.8, icon: "✨", desc: "Hỗ trợ Shaders Ray-Tracing mượt mà trên Fabric." },
  { id: 3, name: "Just Enough Items (JEI)", category: "Utility", downloads: "45.1M", rating: 5.0, icon: "📖", desc: "Xem công thức chế tạo và danh sách vật phẩm." },
  { id: 4, name: "Sophisticated Backpacks", category: "Mods", downloads: "12.8M", rating: 4.7, icon: "🎒", desc: "Túi đồ thông minh nâng cấp sức chứa cho nhân vật." },
];

function LoaderIcon({ loader, size = 14 }: { loader: Loader; size?: number }) {
  const { icon: Icon, color } = LOADER_ICON[loader] || LOADER_ICON.vanilla;
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

export function App() {
  const [dark, setDark] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [selectedVersion, setSelectedVersion] = useState<VersionItem>(VERSIONS[0]);
  const [versionOpen, setVersionOpen] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
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

  return (
    <div className={dark ? "dark" : ""} style={{ width: "100vw", height: "100vh", fontFamily: "'Inter', sans-serif" }}>
      <div
        className="relative flex flex-col overflow-hidden w-full h-full select-none"
        style={{
          background: dark ? "#0f172a" : "#f8fafc",
          color: dark ? "#e2e8f0" : "#0f172a",
        }}
      >
        {/* Background Grid Pattern */}
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

        {/* 100% FIGMA TOP NAVBAR */}
        <nav
          className="relative z-20 flex items-center px-5 flex-shrink-0"
          style={{
            height: 64,
            borderBottom: `1px solid ${dark ? "#334155" : "#e2e8f0"}`,
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
              <span className="font-bold tracking-tight text-base" style={{ letterSpacing: "0.02em" }}>
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
                  color: activeTab === id ? "#10b981" : dark ? "#94a3b8" : "#64748b",
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
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105"
              style={{
                background: dark ? "rgba(51,65,85,0.5)" : "rgba(226,232,240,0.7)",
                color: dark ? "#94a3b8" : "#64748b",
              }}
              title="Settings"
            >
              <Settings size={15} />
            </button>

            {/* Dark/Light Theme Switcher */}
            <button
              onClick={handleToggleTheme}
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

        {/* 100% FIGMA MAIN CONTENT AREA */}
        <div className="flex-1 overflow-y-auto relative z-10">
          {/* TAB 1: HOME & NEWS */}
          {activeTab === "home" && (
            <div className="px-5 py-4 space-y-4">
              {/* Hero Banner */}
              <div className="relative rounded-2xl overflow-hidden flex-shrink-0" style={{ height: 200 }}>
                <img
                  src="https://images.unsplash.com/photo-1629429407759-01cd3d7cfb38?w=1024&h=220&fit=crop&auto=format"
                  alt="Minecraft Tricky Trials"
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
                      className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-widest"
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
                    <h1 className="font-bold mb-1 text-2xl text-white leading-tight">
                      Minecraft 1.21.1 <span style={{ color: "#10b981" }}>Tricky Trials Update</span>
                    </h1>
                    <p className="text-xs mb-3 text-slate-300 max-w-sm">
                      New Trial Chambers, the Mace weapon, Wind Charges, Breeze mobs, and copper structures await.
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handlePlay}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
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
                <div
                  className="rounded-2xl overflow-hidden transition-all duration-200 hover:scale-[1.02] cursor-pointer"
                  style={{
                    background: dark ? "rgba(24,24,27,0.8)" : "rgba(255,255,255,0.8)",
                    border: `1px solid ${dark ? "#334155" : "#e2e8f0"}`,
                  }}
                >
                  <div className="relative h-28 bg-slate-800 overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=120&fit=crop&auto=format"
                      alt="News"
                      className="w-full h-full object-cover opacity-70"
                    />
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-600 text-white">
                      NEWS
                    </span>
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold text-sm mb-1 leading-tight">Mob Vote 2024 Results Announced</h3>
                    <p className="text-xs text-slate-400">The Armadillo won the community vote and is live in 1.21.</p>
                  </div>
                </div>

                {/* Fabric Card */}
                <div
                  className="rounded-2xl overflow-hidden transition-all duration-200 hover:scale-[1.02] cursor-pointer"
                  style={{
                    background: dark ? "rgba(24,24,27,0.8)" : "rgba(255,255,255,0.8)",
                    border: `1px solid ${dark ? "#334155" : "#e2e8f0"}`,
                  }}
                >
                  <div className="h-28 flex items-center justify-center bg-indigo-950">
                    <div className="text-center">
                      <div className="text-3xl mb-1">⚡</div>
                      <div className="text-xs font-bold text-amber-400 uppercase">Fabric Loader</div>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-sm">Fabric 0.15.11</h3>
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-400 font-bold">
                        Updated
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">Now supports 1.21.1 with improved mod compatibility.</p>
                  </div>
                </div>

                {/* Iris Shaders Card */}
                <div
                  className="rounded-2xl overflow-hidden transition-all duration-200 hover:scale-[1.02] cursor-pointer"
                  style={{
                    background: dark ? "rgba(24,24,27,0.8)" : "rgba(255,255,255,0.8)",
                    border: `1px solid ${dark ? "#334155" : "#e2e8f0"}`,
                  }}
                >
                  <div className="relative h-28 overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=120&fit=crop&auto=format"
                      alt="Iris Shaders"
                      className="w-full h-full object-cover opacity-80"
                    />
                    <div className="absolute bottom-2 left-3 text-xs font-bold text-cyan-400">
                      ✦ IRIS SHADERS
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-sm">Complementary v5.3</h3>
                      <div className="flex items-center gap-0.5 text-amber-400 text-xs">
                        <Star size={10} fill="currentColor" /> 4.9
                      </div>
                    </div>
                    <p className="text-xs text-slate-400">Volumetric clouds & Ray-traced reflections.</p>
                  </div>
                </div>
              </div>

              {/* Featured Servers Bar */}
              <div
                className="rounded-2xl p-3"
                style={{
                  background: dark ? "rgba(24,24,27,0.8)" : "rgba(255,255,255,0.8)",
                  border: `1px solid ${dark ? "#334155" : "#e2e8f0"}`,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-extrabold text-xs tracking-wider uppercase text-slate-300">
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
                          <span className="font-bold text-xs truncate">{server.name}</span>
                          <PingDot ping={server.ping} />
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

          {/* TAB 2: MODS & PACKS (100% FIGMA DESIGN) */}
          {activeTab === "mods" && (
            <div className="px-5 py-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black tracking-tight">Mods & Modpacks Gallery</h2>
                  <p className="text-xs text-slate-400">Khám phá và tải về tự động các Mod Loader, Shaders và Modpack tối ưu.</p>
                </div>
                <div className="relative w-64">
                  <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm mod hoặc modpack..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {MODPACKS.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl border transition-all hover:scale-[1.01] flex items-start space-x-3.5"
                    style={{
                      background: dark ? "rgba(24,24,27,0.8)" : "rgba(255,255,255,0.8)",
                      border: `1px solid ${dark ? "#334155" : "#e2e8f0"}`,
                    }}
                  >
                    <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-2xl flex-shrink-0">
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm truncate">{item.name}</h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.desc}</p>
                      <div className="flex items-center justify-between mt-3 text-[11px] text-slate-400 font-semibold">
                        <div className="flex items-center space-x-1 text-amber-400">
                          <Star size={12} fill="currentColor" />
                          <span>{item.rating}</span>
                          <span className="text-slate-500">({item.downloads})</span>
                        </div>
                        <button className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1">
                          <Download size={11} />
                          <span>Tải Ngay</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: ACCOUNT MANAGEMENT (100% FIGMA DESIGN) */}
          {activeTab === "account" && (
            <div className="px-5 py-4 space-y-6 max-w-2xl mx-auto">
              <div>
                <h2 className="text-2xl font-black tracking-tight">Quản Lý Tài Khoản Game</h2>
                <p className="text-xs text-slate-400 mt-1">Cấu hình hồ sơ tài khoản Offline (Cracked) hoặc Microsoft Online OAuth2.</p>
              </div>

              {/* Active User Card */}
              {account && (
                <div
                  className="p-5 rounded-2xl border flex items-center justify-between shadow-xl"
                  style={{
                    background: dark ? "rgba(24,24,27,0.9)" : "rgba(255,255,255,0.9)",
                    border: `1px solid ${dark ? "#334155" : "#e2e8f0"}`,
                  }}
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white text-xl shadow-lg"
                      style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}
                    >
                      {account.username.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-lg">{account.username}</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {account.account_type} Mode
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">UUID: {account.uuid}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 text-emerald-400 text-xs font-bold bg-emerald-500/10 px-3 py-1.5 rounded-xl">
                    <CheckCircle size={14} />
                    <span>Active Profile</span>
                  </div>
                </div>
              )}

              {/* Change Offline Username Form */}
              <div
                className="p-5 rounded-2xl border space-y-3"
                style={{
                  background: dark ? "rgba(24,24,27,0.6)" : "rgba(255,255,255,0.6)",
                  border: `1px solid ${dark ? "#334155" : "#e2e8f0"}`,
                }}
              >
                <h3 className="font-bold text-sm">Cập Nhật Tên Offline (Cracked)</h3>
                <form onSubmit={handleSaveOfflineName} className="flex gap-2">
                  <input
                    type="text"
                    value={offlineNameInput}
                    onChange={(e) => setOfflineNameInput(e.target.value)}
                    placeholder="Tên mới..."
                    className="flex-1 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold outline-none focus:border-emerald-500 text-slate-100"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white transition-all"
                  >
                    Lưu Tên Này
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* 100% FIGMA STICKY BOTTOM ACTION BAR */}
        <div
          className="relative z-20 flex items-center px-5 gap-3 flex-shrink-0"
          style={{
            height: 80,
            borderTop: `1px solid ${dark ? "#334155" : "#e2e8f0"}`,
            background: dark ? "rgba(15,23,42,0.9)" : "rgba(255,255,255,0.9)",
            backdropFilter: "blur(16px)",
          }}
        >
          {/* Account Selector Card */}
          <div
            onClick={() => setActiveTab("account")}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer transition-all hover:scale-[1.02]"
            style={{
              background: dark ? "rgba(30,41,59,0.7)" : "rgba(248,250,252,0.9)",
              border: `1px solid ${dark ? "#334155" : "#e2e8f0"}`,
              minWidth: 180,
            }}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 text-white"
              style={{
                background: "linear-gradient(135deg, #10b981, #059669)",
                boxShadow: "0 0 10px rgba(16,185,129,0.3)",
              }}
            >
              {account?.username ? account.username.substring(0, 2).toUpperCase() : "ST"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-xs truncate">{account?.username || "Steve"}</div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] text-emerald-400 font-semibold">{account?.account_type || "Offline"}</span>
              </div>
            </div>
            <ChevronDown size={12} className="text-slate-400" />
          </div>

          {/* Version Dropdown Selector */}
          <div className="flex-1 flex items-center justify-center gap-2">
            <div className="relative">
              <button
                onClick={() => setVersionOpen(!versionOpen)}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-medium text-xs transition-all hover:scale-[1.02]"
                style={{
                  background: dark ? "rgba(30,41,59,0.7)" : "rgba(248,250,252,0.9)",
                  border: `1px solid ${dark ? "#334155" : "#e2e8f0"}`,
                  minWidth: 240,
                }}
              >
                <LoaderIcon loader={selectedVersion.loader} size={15} />
                <span className="flex-1 text-left font-mono truncate">{selectedVersion.label}</span>
                <ChevronDown size={13} className={`text-slate-400 transition-transform ${versionOpen ? "rotate-180" : ""}`} />
              </button>

              {versionOpen && (
                <div
                  className="absolute bottom-full mb-2 left-0 right-0 rounded-xl overflow-hidden p-1 shadow-2xl z-50"
                  style={{
                    background: dark ? "#18181b" : "#ffffff",
                    border: `1px solid ${dark ? "#334155" : "#e2e8f0"}`,
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
                      <span>{v.label}</span>
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
                border: `1px solid ${dark ? "#334155" : "#e2e8f0"}`,
                color: "#64748b",
              }}
            >
              <RefreshCw size={14} />
            </button>
          </div>

          {/* Right Action Icons & PLAY Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenFolder}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110"
              style={{
                background: dark ? "rgba(30,41,59,0.7)" : "rgba(248,250,252,0.9)",
                border: `1px solid ${dark ? "#334155" : "#e2e8f0"}`,
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
                border: `1px solid ${dark ? "#334155" : "#e2e8f0"}`,
                color: "#64748b",
              }}
              title="Cấu hình Launcher"
            >
              <Settings size={14} />
            </button>

            {/* Main PLAY Button */}
            <button
              disabled={isLaunching}
              onClick={handlePlay}
              className="flex items-center gap-2.5 px-6 rounded-xl font-extrabold transition-all duration-200 hover:scale-[1.03] active:scale-95"
              style={{
                height: 50,
                background: "linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)",
                color: "#fff",
                boxShadow: "0 0 30px rgba(16,185,129,0.5), 0 4px 16px rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              {isLaunching ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Play size={18} fill="currentColor" />
              )}
              <div className="text-left">
                <div className="leading-none text-base tracking-wider">PLAY</div>
                <div className="text-[9px] tracking-widest opacity-80 uppercase leading-none mt-0.5">
                  {isLaunching ? "Launching..." : "ENTER THE GAME"}
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-5 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded bg-emerald-500 text-white font-black text-xs flex items-center justify-center">
                  MC
                </span>
                <h3 className="font-extrabold text-base">Cấu Hình Launcher & Engine</h3>
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
                  className="w-full p-2.5 mt-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-300"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  invoke("update_config", { config }).catch(() => {});
                  setIsSettingsOpen(false);
                }}
                className="px-5 py-2 rounded-xl bg-emerald-600 font-bold text-xs text-white"
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

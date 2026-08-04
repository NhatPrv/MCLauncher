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
  Sparkles,
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
  { id: "1.21.1", label: "1.21.1 — Tricky Trials Update", loader: "vanilla", versionStr: "1.21.1" },
  { id: "1.21.1-fabric", label: "1.21.1 — Fabric Loader 0.16", loader: "fabric", versionStr: "1.21.1" },
  { id: "1.20.4-forge", label: "1.20.4 — Minecraft Forge 49.0", loader: "forge", versionStr: "1.20.4" },
  { id: "1.20.1-optifine", label: "1.20.1 — OptiFine HD U I7", loader: "optifine", versionStr: "1.20.1" },
  { id: "1.19.4", label: "1.19.4 — Vanilla Standard", loader: "vanilla", versionStr: "1.19.4" },
];

const LOADER_ICON: Record<Loader, { icon: React.ElementType; color: string; label: string }> = {
  vanilla: { icon: Package, color: "#818cf8", label: "Vanilla" },
  fabric: { icon: Zap, color: "#fbbf24", label: "Fabric" },
  forge: { icon: Hammer, color: "#f87171", label: "Forge" },
  optifine: { icon: Search, color: "#22d3ee", label: "OptiFine" },
};

const SERVERS = [
  { name: "Hypixel Network", address: "mc.hypixel.net", ping: 42, players: 87432, online: true, icon: "⚔️" },
  { name: "Complex Gaming", address: "hub.mc-complex.com", ping: 78, players: 12904, online: true, icon: "🏙️" },
  { name: "ManaCube Network", address: "play.manacube.com", ping: 112, players: 4201, online: true, icon: "🌐" },
];

const MODPACKS = [
  { id: 1, name: "Sodium FPS Booster", category: "Mods", downloads: "24.5M", rating: 4.9, icon: "⚡", desc: "Tối ưu hóa render engine gia tăng FPS tối đa 120+." },
  { id: 2, name: "Iris Shaders Core", category: "Shaders", downloads: "18.2M", rating: 4.8, icon: "✨", desc: "Hỗ trợ Shaders Ray-Tracing chiếu sáng mượt mà." },
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
    <span className="inline-flex items-center gap-1 text-xs font-mono font-bold" style={{ color }}>
      <span className="w-2 h-2 rounded-full inline-block animate-pulse" style={{ backgroundColor: color }} />
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
    <div className={dark ? "dark" : ""} style={{ width: "100vw", height: "100vh" }}>
      <div
        className="relative flex flex-col overflow-hidden w-full h-full select-none"
        style={{
          background: dark ? "#0a0f1d" : "#f1f5f9",
          color: dark ? "#f8fafc" : "#0f172a",
        }}
      >
        {/* Artistic Wallpaper Background Layer */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <img
            src="https://images.unsplash.com/photo-1627856013091-fed6e4e30025?auto=format&fit=crop&w=1920&q=80"
            alt="Background Artwork"
            className="w-full h-full object-cover"
            style={{
              opacity: dark ? 0.22 : 0.1,
              filter: "blur(4px) saturate(1.3)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: dark
                ? "radial-gradient(ellipse 90% 60% at 50% -10%, rgba(16,185,129,0.15) 0%, rgba(10,15,29,0.95) 75%)"
                : "radial-gradient(ellipse 90% 60% at 50% -10%, rgba(16,185,129,0.1) 0%, rgba(241,245,249,0.95) 75%)",
            }}
          />
        </div>

        {/* ULTRA PREMIUM TOP NAVBAR */}
        <nav
          className="relative z-20 flex items-center px-6 flex-shrink-0 backdrop-blur-2xl border-b transition-colors duration-300"
          style={{
            height: 64,
            borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
            background: dark ? "rgba(10,15,29,0.75)" : "rgba(255,255,255,0.85)",
          }}
        >
          {/* Logo Brand */}
          <div className="flex items-center gap-3 min-w-[200px]">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-400/30"
              style={{
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              }}
            >
              <span className="font-black text-white text-base tracking-wider font-rajdhani">MC</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold tracking-tight text-lg font-rajdhani" style={{ letterSpacing: "0.03em" }}>
                  MCLauncher
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm">
                  PRO
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold tracking-wide">
                <Shield size={10} />
                <span>Zero Malware Engine</span>
              </div>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <div className="flex-1 flex items-center justify-center gap-2">
            {([
              { id: "home", label: "Trang Chủ", icon: Newspaper },
              { id: "mods", label: "Mods & Loaders", icon: Layers },
              { id: "account", label: "Tài Khoản", icon: User },
            ] as { id: Tab; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all duration-200"
                style={{
                  background: activeTab === id
                    ? "linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(5,150,105,0.1) 100%)"
                    : "transparent",
                  color: activeTab === id ? "#10b981" : dark ? "#94a3b8" : "#64748b",
                  border: activeTab === id ? "1px solid rgba(16,185,129,0.3)" : "1px solid transparent",
                  boxShadow: activeTab === id ? "0 4px 12px rgba(16,185,129,0.15)" : "none",
                }}
              >
                <Icon size={15} />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2.5 min-w-[200px] justify-end">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 border"
              style={{
                background: dark ? "rgba(30,41,59,0.6)" : "rgba(255,255,255,0.8)",
                borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                color: dark ? "#cbd5e1" : "#475569",
              }}
              title="Settings"
            >
              <Settings size={16} />
            </button>

            {/* Dark/Light Theme Switcher */}
            <button
              onClick={handleToggleTheme}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-200"
              style={{
                background: dark ? "rgba(30,41,59,0.6)" : "rgba(255,255,255,0.8)",
                borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                color: dark ? "#cbd5e1" : "#475569",
              }}
            >
              {dark ? <Moon size={14} className="text-amber-400" /> : <Sun size={14} className="text-amber-500" />}
              <span className="text-xs font-bold hidden sm:inline">{dark ? "Dark" : "Light"}</span>
            </button>
          </div>
        </nav>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 overflow-y-auto relative z-10 px-6 py-5">
          {/* TAB 1: HOME & NEWS */}
          {activeTab === "home" && (
            <div className="space-y-5">
              {/* Hero Banner */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-700/50" style={{ height: 210 }}>
                <img
                  src="https://images.unsplash.com/photo-1627856013091-fed6e4e30025?auto=format&fit=crop&w=1200&q=80"
                  alt="Minecraft Hero Artwork"
                  className="w-full h-full object-cover"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background: "linear-gradient(90deg, rgba(10,15,29,0.95) 0%, rgba(10,15,29,0.7) 50%, transparent 100%)",
                  }}
                />
                <div className="absolute inset-0 flex flex-col justify-between p-6">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-green-400 text-white shadow-lg shadow-emerald-500/30 flex items-center gap-1 font-rajdhani">
                      <Sparkles size={12} />
                      MINECRAFT 1.21.1 UPDATE
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      <Clock size={11} className="inline mr-1" />
                      Phát hành chính thức
                    </span>
                  </div>
                  <div>
                    <h1 className="font-extrabold text-3xl text-white tracking-tight leading-tight font-rajdhani">
                      Tricky Trials <span className="text-emerald-400">Official Release</span>
                    </h1>
                    <p className="text-xs text-slate-300 max-w-md mt-1 leading-relaxed">
                      Khám phá các phòng thử thách Trial Chambers mới, vũ khí Mace quyền năng, Breeze mobs và công trình đồ họa shader mượt mà.
                    </p>
                    <div className="flex items-center gap-3 mt-4">
                      <button
                        onClick={handlePlay}
                        className="px-6 py-2.5 rounded-xl font-black text-xs text-white uppercase tracking-wider flex items-center gap-2 bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-400 hover:to-green-400 shadow-xl shadow-emerald-500/30 hover:scale-105 transition-all font-rajdhani"
                      >
                        <Play size={14} fill="currentColor" />
                        Chơi Bản 1.21.1 Ngay
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3-Column Cards Grid */}
              <div className="grid grid-cols-3 gap-4">
                {/* News Card */}
                <div
                  className="rounded-2xl overflow-hidden border transition-all duration-300 hover:scale-[1.02] shadow-lg group cursor-pointer"
                  style={{
                    background: dark ? "rgba(30,41,59,0.5)" : "rgba(255,255,255,0.9)",
                    borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <div className="relative h-28 overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=120&fit=crop&auto=format"
                      alt="News"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <span className="absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-black uppercase bg-indigo-600 text-white shadow">
                      TIN TỨC
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-sm mb-1 leading-snug font-rajdhani group-hover:text-emerald-400 transition-colors">
                      Mob Vote 2024 Result Announced
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Armadillo đã chiến thắng bình chọn cộng đồng và có mặt trong bản 1.21.
                    </p>
                  </div>
                </div>

                {/* Fabric Card */}
                <div
                  className="rounded-2xl overflow-hidden border transition-all duration-300 hover:scale-[1.02] shadow-lg group cursor-pointer"
                  style={{
                    background: dark ? "rgba(30,41,59,0.5)" : "rgba(255,255,255,0.9)",
                    borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <div className="h-28 flex items-center justify-center bg-gradient-to-tr from-amber-950 to-indigo-950">
                    <div className="text-center">
                      <div className="text-3xl mb-1">⚡</div>
                      <div className="text-xs font-black text-amber-400 uppercase tracking-widest font-rajdhani">
                        Fabric Loader
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-sm font-rajdhani group-hover:text-amber-400 transition-colors">
                        Fabric 0.16.0
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Cập nhật
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Tối ưu hóa bộ nhớ RAM tiêu thụ dưới 40MB và gia tăng tốc độ load game.
                    </p>
                  </div>
                </div>

                {/* Iris Shaders Card */}
                <div
                  className="rounded-2xl overflow-hidden border transition-all duration-300 hover:scale-[1.02] shadow-lg group cursor-pointer"
                  style={{
                    background: dark ? "rgba(30,41,59,0.5)" : "rgba(255,255,255,0.9)",
                    borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <div className="relative h-28 overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=120&fit=crop&auto=format"
                      alt="Iris Shaders"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute bottom-2 left-3 text-xs font-black text-cyan-400 font-rajdhani tracking-wider">
                      ✦ IRIS SHADERS CORE
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-sm font-rajdhani group-hover:text-cyan-400 transition-colors">
                        Complementary v5.3
                      </h3>
                      <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                        <Star size={11} fill="currentColor" /> 4.9
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Hiệu ứng chiếu sáng Ray-Tracing mượt mà gia tăng 120 FPS+.
                    </p>
                  </div>
                </div>
              </div>

              {/* Featured Servers Bar */}
              <div
                className="rounded-2xl p-4 border backdrop-blur-xl shadow-lg"
                style={{
                  background: dark ? "rgba(30,41,59,0.5)" : "rgba(255,255,255,0.9)",
                  borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-black text-xs tracking-wider uppercase text-slate-300 font-rajdhani">
                    FEATURED MINECRAFT SERVERS
                  </h3>
                  <span className="text-xs text-emerald-400 font-bold">3 Máy chủ Online</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {SERVERS.map((server) => (
                    <div
                      key={server.name}
                      className="flex items-center gap-3 p-3 rounded-xl border transition-all hover:scale-[1.02]"
                      style={{
                        background: dark ? "rgba(15,23,42,0.7)" : "rgba(248,250,252,0.9)",
                        borderColor: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
                      }}
                    >
                      <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-lg flex-shrink-0">
                        {server.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs truncate font-rajdhani">{server.name}</span>
                          <PingDot ping={server.ping} />
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                          <Users size={10} />
                          <span className="font-mono">{server.players.toLocaleString()} players</span>
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
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black tracking-tight font-rajdhani">Mods & Modpacks Gallery</h2>
                  <p className="text-xs text-slate-400">Khám phá và cài đặt tự động các Mod Loader, Shaders và Modpack bán chạy nhất.</p>
                </div>
                <div className="relative w-64">
                  <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm Mod hoặc Shader..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {MODPACKS.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl border transition-all hover:scale-[1.01] flex items-start space-x-4 backdrop-blur-xl shadow-lg"
                    style={{
                      background: dark ? "rgba(30,41,59,0.5)" : "rgba(255,255,255,0.9)",
                      borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                    }}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl flex-shrink-0 shadow-md">
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-extrabold text-sm truncate font-rajdhani">{item.name}</h4>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">{item.desc}</p>
                      <div className="flex items-center justify-between mt-3 text-[11px] font-bold">
                        <div className="flex items-center space-x-1 text-amber-400">
                          <Star size={12} fill="currentColor" />
                          <span>{item.rating}</span>
                          <span className="text-slate-500">({item.downloads})</span>
                        </div>
                        <button className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center space-x-1 shadow-md shadow-emerald-600/20">
                          <Download size={12} />
                          <span>Tải Ngay</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: ACCOUNT MANAGEMENT */}
          {activeTab === "account" && (
            <div className="space-y-6 max-w-2xl mx-auto py-2">
              <div>
                <h2 className="text-2xl font-black tracking-tight font-rajdhani">Quản Lý Tài Khoản Game</h2>
                <p className="text-xs text-slate-400 mt-1">Cấu hình hồ sơ tài khoản Offline (Cracked) hoặc Microsoft Online Account chính chủ.</p>
              </div>

              {account && (
                <div
                  className="p-6 rounded-3xl border flex items-center justify-between shadow-2xl backdrop-blur-xl"
                  style={{
                    background: dark ? "rgba(30,41,59,0.7)" : "rgba(255,255,255,0.9)",
                    borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                  }}
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white text-xl shadow-lg shadow-emerald-500/20 font-rajdhani"
                      style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}
                    >
                      {account.username.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-xl font-rajdhani">{account.username}</span>
                        <span className="px-3 py-0.5 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {account.account_type} Mode
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono mt-1">UUID: {account.uuid}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 text-emerald-400 text-xs font-extrabold bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20">
                    <CheckCircle size={15} />
                    <span>Đang Hoạt Động</span>
                  </div>
                </div>
              )}

              {/* Form Tùy Chỉnh Tên Offline */}
              <div
                className="p-6 rounded-3xl border space-y-4 backdrop-blur-xl"
                style={{
                  background: dark ? "rgba(30,41,59,0.5)" : "rgba(255,255,255,0.8)",
                  borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                }}
              >
                <h3 className="font-extrabold text-base font-rajdhani">Cập Nhật Tên Người Chơi Offline</h3>
                <form onSubmit={handleSaveOfflineName} className="flex gap-3">
                  <input
                    type="text"
                    value={offlineNameInput}
                    onChange={(e) => setOfflineNameInput(e.target.value)}
                    placeholder="Tên mới..."
                    className="flex-1 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold outline-none focus:border-emerald-500 text-slate-100 font-mono"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-extrabold text-xs text-white transition-all shadow-lg shadow-emerald-600/20"
                  >
                    Lưu Tên Này
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* ULTRA GAMING STICKY BOTTOM ACTION BAR */}
        <div
          className="relative z-20 flex items-center px-6 gap-4 flex-shrink-0 backdrop-blur-2xl border-t transition-colors duration-300 shadow-2xl"
          style={{
            height: 84,
            borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
            background: dark ? "rgba(10,15,29,0.92)" : "rgba(255,255,255,0.92)",
          }}
        >
          {/* Left: Account Selector */}
          <div
            onClick={() => setActiveTab("account")}
            className="flex items-center gap-3 px-4 py-2.5 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] border"
            style={{
              background: dark ? "rgba(30,41,59,0.7)" : "rgba(248,250,252,0.9)",
              borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
              minWidth: 190,
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 text-white shadow-md font-rajdhani"
              style={{
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              }}
            >
              {account?.username ? account.username.substring(0, 2).toUpperCase() : "ST"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-extrabold text-xs truncate font-rajdhani">{account?.username || "Steve"}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-emerald-400 font-extrabold">{account?.account_type || "Offline"}</span>
              </div>
            </div>
            <ChevronDown size={14} className="text-slate-400" />
          </div>

          {/* Center: Version Selector Dropdown */}
          <div className="flex-1 flex items-center justify-center gap-2">
            <div className="relative">
              <button
                onClick={() => setVersionOpen(!versionOpen)}
                className="flex items-center gap-3 px-5 py-3 rounded-2xl font-bold text-xs transition-all hover:scale-[1.02] border"
                style={{
                  background: dark ? "rgba(30,41,59,0.7)" : "rgba(248,250,252,0.9)",
                  borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                  minWidth: 260,
                }}
              >
                <LoaderIcon loader={selectedVersion.loader} size={16} />
                <span className="flex-1 text-left font-mono truncate">{selectedVersion.label}</span>
                <ChevronDown size={14} className={`text-emerald-400 transition-transform ${versionOpen ? "rotate-180" : ""}`} />
              </button>

              {versionOpen && (
                <div
                  className="absolute bottom-full mb-3 left-0 right-0 rounded-2xl overflow-hidden p-1.5 shadow-2xl z-50 backdrop-blur-2xl"
                  style={{
                    background: dark ? "#0f172a" : "#ffffff",
                    border: `1px solid ${dark ? "rgba(255,255,255,0.1)" : "#e2e8f0"}`,
                  }}
                >
                  {VERSIONS.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => {
                        setSelectedVersion(v);
                        setVersionOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-mono text-left transition-colors ${
                        selectedVersion.id === v.id
                          ? "bg-emerald-500/20 text-emerald-400 font-bold"
                          : "hover:bg-slate-800/60 text-slate-300"
                      }`}
                    >
                      <LoaderIcon loader={v.loader} size={15} />
                      <span>{v.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => {}}
              className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all hover:scale-105 border"
              style={{
                background: dark ? "rgba(30,41,59,0.7)" : "rgba(248,250,252,0.9)",
                borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                color: "#10b981",
              }}
              title="Tải lại danh sách"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          {/* Right: Quick Icon Actions & MASSIVE GLOWING PLAY BUTTON */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenFolder}
              className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all hover:scale-105 border"
              style={{
                background: dark ? "rgba(30,41,59,0.7)" : "rgba(248,250,252,0.9)",
                borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                color: "#cbd5e1",
              }}
              title="Mở thư mục .minecraft"
            >
              <Folder size={16} />
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all hover:scale-105 border"
              style={{
                background: dark ? "rgba(30,41,59,0.7)" : "rgba(248,250,252,0.9)",
                borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                color: "#cbd5e1",
              }}
              title="Cấu hình Launcher"
            >
              <Settings size={16} />
            </button>

            {/* MASSIVE 3D EMERALD GLOWING PLAY BUTTON */}
            <button
              disabled={isLaunching}
              onClick={handlePlay}
              className={`flex items-center gap-3 px-8 rounded-2xl font-black transition-all duration-300 font-rajdhani border-b-4 border-emerald-800 ring-2 ring-emerald-400/30 ${
                isLaunching
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed border-none"
                  : "bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-400 hover:to-green-400 text-white hover:scale-[1.04] active:scale-95 animate-emerald-glow"
              }`}
              style={{ height: 54 }}
            >
              {isLaunching ? (
                <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
              ) : (
                <Play size={22} fill="currentColor" />
              )}
              <div className="text-left">
                <div className="leading-none text-lg tracking-widest font-black">PLAY</div>
                <div className="text-[9px] tracking-widest opacity-90 uppercase leading-none mt-1 font-bold">
                  {isLaunching ? "Launching..." : "ENTER THE GAME"}
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-5 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <span className="w-7 h-7 rounded-xl bg-emerald-500 text-white font-black text-xs flex items-center justify-center font-rajdhani">
                  MC
                </span>
                <h3 className="font-extrabold text-base font-rajdhani">Cấu Hình Launcher Engine Pro</h3>
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
                Lưu Cấu Hình
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

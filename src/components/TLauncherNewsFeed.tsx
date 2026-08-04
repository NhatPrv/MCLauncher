import React from 'react';
import { Newspaper, Flame, Server, Zap } from 'lucide-react';
import { AppConfig } from '../types';

interface TLauncherNewsFeedProps {
  config: AppConfig;
  onSelectVersion: (ver: string) => void;
}

export const TLauncherNewsFeed: React.FC<TLauncherNewsFeedProps> = ({ config, onSelectVersion }) => {
  const newsItems = [
    {
      id: 1,
      title: 'Minecraft 1.21.1 Trích Xuất Cập Nhật "Tricky Trials"',
      tag: 'Bản Cập Nhật',
      date: '04.08.2026',
      image: 'https://images.unsplash.com/photo-1627856013091-fed6e4e30025?auto=format&fit=crop&w=600&q=80',
      description: 'Khám phá các phòng thử thách Trial Chambers mới, vũ khí Mace quyền năng và các hiệu ứng Breeze mới nhất.',
      version: '1.21.1',
    },
    {
      id: 2,
      title: 'Fabric Loader v0.16.0 - Đạt Hiệu Năng Tối Đa',
      tag: 'Mod Loader',
      date: '02.08.2026',
      image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80',
      description: 'Bản cập nhật Fabric cải thiện tốc độ khởi động game lên 35%, tối ưu hóa bộ nhớ RAM tiêu thụ dưới 40MB.',
      version: '1.21',
    },
    {
      id: 3,
      title: 'Iris Shaders & Sodium Core - Đồ Họa 120 FPS+',
      tag: 'Graphics',
      date: '28.07.2026',
      image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80',
      description: 'Trải nghiệm gói Shaders siêu thực với công nghệ chiếu sáng Ray-Tracing mượt mà trên mọi dòng card màn hình.',
      version: '1.20.4',
    },
  ];

  const featuredServers = [
    { name: 'Hypixel Network', ip: 'mc.hypixel.net', players: '45,210', online: true },
    { name: 'Complex Gaming', ip: 'hub.mc-complex.com', players: '8,430', online: true },
    { name: 'ManaCube Network', ip: 'play.manacube.com', players: '3,120', online: true },
  ];

  return (
    <div className="flex-1 p-6 overflow-y-auto space-y-6">
      {/* Banner Khuyến Mãi / Thông Báo TLauncher Classic Style */}
      <div className={`p-6 rounded-2xl border relative overflow-hidden shadow-xl ${
        config.theme === 'dark'
          ? 'bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border-amber-500/30'
          : 'bg-gradient-to-r from-amber-100 via-orange-50 to-white border-amber-300'
      }`}>
        <div className="flex items-center justify-between relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/40">
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>TLauncher Classic Edition Engine</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">
              MCLauncher - Trình Khởi Chạy Minecraft Tốc Độ Cao
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Trải nghiệm phong cách TLauncher huyền thoại kết hợp với nhân Rust Backend siêu nhẹ (<span className="text-amber-400 font-bold">&lt;50MB RAM</span>) và Bảo mật Memory Safety 100%.
            </p>
          </div>

          <div className="hidden lg:flex items-center space-x-3">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-amber-500/30">
              TL
            </div>
          </div>
        </div>
      </div>

      {/* Grid Bài Viết Tin Tức TLauncher */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Newspaper className="w-5 h-5 text-amber-500" />
            <h3 className="font-extrabold text-lg tracking-tight">Bảng Tin & Tin Tức Game</h3>
          </div>
          <span className="text-xs text-slate-400 font-semibold">Cập nhật liên tục</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {newsItems.map((item) => (
            <div
              key={item.id}
              className={`rounded-2xl border overflow-hidden flex flex-col justify-between transition-all duration-200 hover:scale-[1.02] shadow-md group ${
                config.theme === 'dark'
                  ? 'bg-slate-900/80 border-slate-800 hover:border-amber-500/50'
                  : 'bg-white border-slate-200 hover:border-amber-400'
              }`}
            >
              <div>
                <div className="h-40 relative overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow">
                    {item.tag}
                  </span>
                </div>

                <div className="p-4 space-y-2">
                  <span className="text-[10px] text-slate-400 font-mono">{item.date}</span>
                  <h4 className="font-bold text-sm leading-snug group-hover:text-amber-400 transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="p-4 pt-0">
                <button
                  onClick={() => onSelectVersion(item.version)}
                  className="w-full py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 font-bold text-xs flex items-center justify-center space-x-1.5 transition-all"
                >
                  <span>Chơi Phiên Bản {item.version}</span>
                  <Zap className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Servers Sidebar Widget */}
      <div className={`p-5 rounded-2xl border ${
        config.theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center space-x-2 mb-3">
          <Server className="w-4 h-4 text-emerald-400" />
          <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-300">Máy Chủ Khuyên Dùng (Featured Servers)</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {featuredServers.map((srv) => (
            <div key={srv.name} className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between">
              <div>
                <div className="font-bold text-xs">{srv.name}</div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">{srv.ip}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold text-emerald-400">{srv.players} Online</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Newspaper, Flame, Zap, Server } from 'lucide-react';
import { AppConfig } from '../types';

interface NewsBannerProps {
  config: AppConfig;
  onSelectVersion: (ver: string) => void;
}

export const NewsBanner: React.FC<NewsBannerProps> = ({ config, onSelectVersion }) => {
  const mainArticles = [
    {
      id: 1,
      title: 'Minecraft 1.21.1 Trích Xuất Bản Cập Nhật "Tricky Trials"',
      tag: 'Bản Cập Nhật',
      date: '04.08.2026',
      image: 'https://images.unsplash.com/photo-1627856013091-fed6e4e30025?auto=format&fit=crop&w=800&q=80',
      description: 'Khám phá các phòng thử thách Trial Chambers mới, vũ khí Mace quyền năng và hiệu ứng Breeze sinh động.',
      version: '1.21.1',
    },
    {
      id: 2,
      title: 'Fabric Loader v0.16.0 - Tốc Độ Khởi Động Siêu Nhanh',
      tag: 'Mod Engine',
      date: '02.08.2026',
      image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80',
      description: 'Tối ưu hóa bộ nhớ RAM tiêu thụ dưới 40MB, nâng cao hiệu năng đồ họa và độ ổn định.',
      version: '1.21',
    },
    {
      id: 3,
      title: 'Iris Shaders & Sodium Core - Đồ Họa 120 FPS+',
      tag: 'Graphics',
      date: '28.07.2026',
      image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80',
      description: 'Trải nghiệm các gói Shaders siêu thực với công nghệ chiếu sáng Ray-Tracing cực mượt.',
      version: '1.20.4',
    },
  ];

  const featuredServers = [
    { name: 'Hypixel Network', ip: 'mc.hypixel.net', players: '45,210', status: 'Online' },
    { name: 'Complex Gaming', ip: 'hub.mc-complex.com', players: '8,430', status: 'Online' },
    { name: 'ManaCube Network', ip: 'play.manacube.com', players: '3,120', status: 'Online' },
  ];

  return (
    <div className="flex-1 p-6 overflow-y-auto space-y-6">
      {/* Featured Header Hero Banner */}
      <div className={`p-8 rounded-3xl border relative overflow-hidden shadow-2xl transition-all ${
        config.theme === 'dark'
          ? 'bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950/40 border-slate-800'
          : 'bg-gradient-to-r from-emerald-50 via-green-50 to-white border-emerald-200'
      }`}>
        <div className="flex items-center justify-between relative z-10">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-extrabold">
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>Cập Nhật Mới Nhất</span>
            </div>

            <h2 className="text-3xl font-black tracking-tight">
              Minecraft <span className="text-emerald-400">1.21.1</span> Tricky Trials
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Trải nghiệm phiên bản Minecraft mới nhất cùng bộ công cụ khởi chạy siêu nhẹ (<span className="text-emerald-400 font-bold">RAM &lt; 50MB</span>) và bảo mật bộ nhớ Rust Native.
            </p>

            <button
              onClick={() => onSelectVersion('1.21.1')}
              className="mt-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-white font-extrabold text-xs flex items-center space-x-2 shadow-lg shadow-emerald-500/25 transition-all"
            >
              <span>Chơi Ngay Bản 1.21.1</span>
              <Zap className="w-4 h-4" />
            </button>
          </div>

          <div className="hidden md:block">
            <div className="w-28 h-28 rounded-3xl bg-gradient-to-tr from-emerald-600 to-green-400 flex items-center justify-center text-white text-4xl font-black shadow-xl shadow-emerald-500/20">
              MC
            </div>
          </div>
        </div>
      </div>

      {/* News Grid */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Newspaper className="w-5 h-5 text-emerald-400" />
          <h3 className="font-extrabold text-base tracking-tight">Bảng Tin Minecraft & Modpacks</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {mainArticles.map((article) => (
            <div
              key={article.id}
              className={`rounded-2xl border overflow-hidden flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] shadow-md group ${
                config.theme === 'dark'
                  ? 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/50'
                  : 'bg-white border-slate-200 hover:border-emerald-400 shadow-sm'
              }`}
            >
              <div>
                <div className="h-36 relative overflow-hidden">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-emerald-500 text-white font-black text-[10px] uppercase tracking-wider shadow">
                    {article.tag}
                  </span>
                </div>

                <div className="p-4 space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-mono">{article.date}</span>
                  <h4 className="font-bold text-sm leading-snug group-hover:text-emerald-400 transition-colors">
                    {article.title}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {article.description}
                  </p>
                </div>
              </div>

              <div className="p-4 pt-0">
                <button
                  onClick={() => onSelectVersion(article.version)}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all"
                >
                  <span>Chọn Phiên Bản này</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Server Bar */}
      <div className={`p-5 rounded-2xl border ${
        config.theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center space-x-2 mb-3">
          <Server className="w-4 h-4 text-emerald-400" />
          <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">Máy Chủ Khuyên Dùng (Featured Servers)</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {featuredServers.map((srv) => (
            <div key={srv.name} className={`p-3.5 rounded-xl border flex items-center justify-between ${
              config.theme === 'dark' ? 'bg-slate-800/50 border-slate-700/60' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <div className="font-bold text-xs">{srv.name}</div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">{srv.ip}</div>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                {srv.players}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

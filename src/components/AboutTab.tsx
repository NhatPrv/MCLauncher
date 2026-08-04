import React from 'react';
import { ShieldCheck, Zap, Lock, Code2, ExternalLink } from 'lucide-react';
import { AppConfig } from '../types';

interface AboutTabProps {
  config: AppConfig;
}

export const AboutTab: React.FC<AboutTabProps> = ({ config }) => {
  return (
    <div className="flex-1 p-8 overflow-y-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Về Dự Án MCLauncher</h2>
        <p className="text-slate-400 text-sm mt-1">
          Trình khởi chạy Minecraft thế hệ mới – Nhanh nhất, Bảo mật nhất, Nhẹ nhất.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-6 rounded-2xl border ${
          config.theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 w-fit mb-4">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg">Siêu Nhẹ & Siêu Mượt</h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Nhờ công nghệ Tauri (Rust) thay cho Electron nặng nề, MCLauncher tiêu thụ cực ít tài nguyên (&lt; 50MB RAM).
          </p>
        </div>

        <div className={`p-6 rounded-2xl border ${
          config.theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 w-fit mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg">Bảo Mật Bộ Nhớ Absolute</h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Ngôn ngữ Rust bảo đảm memory-safety tuyệt đối, loại bỏ nguy cơ rò rỉ bộ nhớ hoặc các mã độc ẩn.
          </p>
        </div>

        <div className={`p-6 rounded-2xl border ${
          config.theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 w-fit mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg">Zero Malware & Bloatware</h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Không theo dõi người dùng, không quảng cáo làm phiền, không thu thập dữ liệu cá nhân trái phép.
          </p>
        </div>
      </div>

      <div className={`p-6 rounded-2xl border ${
        config.theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center space-x-3 mb-2">
          <Code2 className="w-5 h-5 text-emerald-500" />
          <h3 className="font-bold text-lg">Mã Nguồn Mở & Cộng Đồng</h3>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          MCLauncher là dự án mã nguồn mở phát hành dưới giấy phép MIT License. Bạn hoàn toàn có thể kiểm tra toàn bộ mã nguồn trên GitHub.
        </p>
        <a
          href="https://github.com/NhatPrv/MCLauncher"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center space-x-2 mt-4 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-md"
        >
          <span>Ghé thăm GitHub Repository</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};

import React from 'react';
import { Play, Layers, User, Settings, Info } from 'lucide-react';
import { AppConfig } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  config: AppConfig;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, config }) => {
  const navItems = [
    { id: 'main', label: 'Chơi Game', icon: Play },
    { id: 'versions', label: 'Phiên Bản & Mods', icon: Layers },
    { id: 'account', label: 'Tài Khoản', icon: User },
    { id: 'settings', label: 'Cấu Hình Game', icon: Settings },
    { id: 'about', label: 'Giới Thiệu', icon: Info },
  ];

  return (
    <aside className={`w-64 border-r flex flex-col justify-between transition-colors duration-200 ${
      config.theme === 'dark' 
        ? 'bg-slate-900/50 border-slate-800' 
        : 'bg-slate-50 border-slate-200'
    }`}>
      <nav className="p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-600 to-green-500 text-white shadow-lg shadow-green-500/25 font-bold scale-[1.02]'
                  : config.theme === 'dark'
                  ? 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Launcher Specs Badge */}
      <div className="p-4 m-4 rounded-xl glass-panel text-xs space-y-1">
        <div className="flex justify-between text-slate-400">
          <span>Engine:</span>
          <span className="font-mono font-semibold text-emerald-400">Tauri v2 (Rust)</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Tải RAM:</span>
          <span className="font-mono font-semibold text-emerald-400">&lt; 50 MB</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Security:</span>
          <span className="font-mono font-semibold text-emerald-400">Zero Malware</span>
        </div>
      </div>
    </aside>
  );
};

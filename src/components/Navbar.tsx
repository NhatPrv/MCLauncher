import React from 'react';
import { Sun, Moon, ShieldCheck, Home, Layers, User, Settings } from 'lucide-react';
import { AppConfig } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  config: AppConfig;
  setConfig: React.Dispatch<React.SetStateAction<AppConfig>>;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  config,
  setConfig,
  onOpenSettings,
}) => {
  const toggleTheme = () => {
    const newTheme = config.theme === 'dark' ? 'light' : 'dark';
    setConfig({ ...config, theme: newTheme });
  };

  const navTabs = [
    { id: 'news', label: 'Trang Chủ', icon: Home },
    { id: 'mods', label: 'Mod & Modpacks', icon: Layers },
    { id: 'account', label: 'Tài Khoản', icon: User },
  ];

  return (
    <nav className={`h-16 px-6 border-b flex items-center justify-between transition-colors duration-300 backdrop-blur-xl ${
      config.theme === 'dark'
        ? 'bg-slate-900/90 border-slate-800/80 text-slate-100'
        : 'bg-white/90 border-slate-200 text-slate-800 shadow-sm'
    }`}>
      {/* Brand & Security Status */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-green-400 flex items-center justify-center shadow-lg shadow-emerald-500/25">
          <span className="font-black text-white text-lg tracking-wider">MC</span>
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-extrabold text-base tracking-tight leading-none">MCLauncher</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Pro Engine
            </span>
          </div>
          <div className="flex items-center space-x-1 mt-0.5">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            <span className="text-[10px] font-bold text-emerald-500 tracking-wide uppercase">Safe & Zero Malware</span>
          </div>
        </div>
      </div>

      {/* Center Navigation Tabs */}
      <div className="flex items-center space-x-1 p-1 rounded-xl bg-slate-800/40 border border-slate-700/50">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center space-x-2 transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-600 to-green-500 text-white shadow-md shadow-emerald-500/20'
                  : config.theme === 'dark'
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Right Controls: Settings & Theme Switcher */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenSettings}
          className={`p-2.5 rounded-xl border transition-all duration-200 ${
            config.theme === 'dark'
              ? 'bg-slate-800/80 border-slate-700 hover:bg-slate-700 text-slate-300 hover:text-white'
              : 'bg-slate-100 border-slate-300 hover:bg-slate-200 text-slate-700'
          }`}
          title="Cài đặt Launcher"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Theme Toggle Switch */}
        <button
          onClick={toggleTheme}
          className={`flex items-center space-x-2 px-3 py-2 rounded-xl border transition-all duration-200 ${
            config.theme === 'dark'
              ? 'bg-slate-800/80 border-slate-700 hover:bg-slate-700 text-amber-400'
              : 'bg-slate-100 border-slate-300 hover:bg-slate-200 text-slate-800'
          }`}
          title={config.theme === 'dark' ? 'Chuyển sang chế độ Sáng' : 'Chuyển sang chế độ Tối'}
        >
          {config.theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold hidden sm:inline">Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-slate-700" />
              <span className="text-xs font-bold hidden sm:inline">Dark Mode</span>
            </>
          )}
        </button>
      </div>
    </nav>
  );
};

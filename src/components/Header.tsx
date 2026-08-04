import React from 'react';
import { Sun, Moon, ShieldCheck, User } from 'lucide-react';
import { Account, AppConfig } from '../types';

interface HeaderProps {
  config: AppConfig;
  setConfig: React.Dispatch<React.SetStateAction<AppConfig>>;
  account: Account | null;
  onNavigateToAccount: () => void;
}

export const Header: React.FC<HeaderProps> = ({ config, setConfig, account, onNavigateToAccount }) => {
  const toggleTheme = () => {
    const newTheme = config.theme === 'dark' ? 'light' : 'dark';
    setConfig({ ...config, theme: newTheme });
  };

  return (
    <header className={`h-16 px-6 flex items-center justify-between border-b transition-colors duration-200 ${
      config.theme === 'dark' 
        ? 'bg-slate-900/80 border-slate-800 text-slate-100' 
        : 'bg-white/80 border-slate-200 text-slate-800'
    }`}>
      {/* Brand & Security Badge */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-400 flex items-center justify-center shadow-lg shadow-green-500/20">
          <span className="font-extrabold text-white text-lg tracking-wider">MC</span>
        </div>
        <div>
          <h1 className="font-bold text-lg leading-none tracking-wide">MCLauncher</h1>
          <div className="flex items-center space-x-1 mt-0.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-xs font-semibold text-emerald-500 tracking-wide uppercase">Safe & Clean Engine</span>
          </div>
        </div>
      </div>

      {/* Account Info & Theme Switcher */}
      <div className="flex items-center space-x-4">
        {/* User Card */}
        <button
          onClick={onNavigateToAccount}
          className={`flex items-center space-x-3 px-3 py-1.5 rounded-lg border transition-all duration-200 ${
            config.theme === 'dark'
              ? 'bg-slate-800/80 border-slate-700 hover:bg-slate-700/80 text-slate-200'
              : 'bg-slate-100 border-slate-300 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <div className="w-7 h-7 rounded-md bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold">
            {account ? account.username.substring(0, 2).toUpperCase() : <User className="w-4 h-4" />}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-bold leading-none">{account ? account.username : 'Chưa chọn tài khoản'}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{account ? account.account_type : 'Khách'}</p>
          </div>
        </button>

        {/* Dark/Light Toggle */}
        <button
          onClick={toggleTheme}
          className={`p-2.5 rounded-lg border transition-all duration-200 ${
            config.theme === 'dark'
              ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-amber-400'
              : 'bg-slate-100 border-slate-300 hover:bg-slate-200 text-slate-700'
          }`}
          title={config.theme === 'dark' ? 'Chuyển sang chế độ Sáng' : 'Chuyển sang chế độ Tối'}
        >
          {config.theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};

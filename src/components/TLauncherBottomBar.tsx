import React, { useState } from 'react';
import { User, Play, RotateCw, Folder, Settings, Check, ChevronDown, Loader2 } from 'lucide-react';
import { Account, AppConfig } from '../types';
import { invoke } from '@tauri-apps/api/core';

interface TLauncherBottomBarProps {
  config: AppConfig;
  account: Account | null;
  setAccount: (acc: Account) => void;
  selectedVersion: string;
  setSelectedVersion: (ver: string) => void;
  selectedLoader: string;
  setSelectedLoader?: (loader: string) => void;
  versionsList: string[];
  onOpenSettings: () => void;
  onOpenMods: () => void;
}

export const TLauncherBottomBar: React.FC<TLauncherBottomBarProps> = ({
  config,
  account,
  setAccount,
  selectedVersion,
  setSelectedVersion,
  selectedLoader,
  versionsList,
  onOpenSettings,
  onOpenMods,
}) => {
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchProgress, setLaunchProgress] = useState<number | null>(null);
  const [usernameInput, setUsernameInput] = useState(account?.username || 'Steve');
  const [useAccounts, setUseAccounts] = useState(true);
  const [showVersionDropdown, setShowVersionDropdown] = useState(false);

  const handlePlay = async () => {
    setIsLaunching(true);
    setLaunchProgress(25);

    try {
      let activeAccount = account;
      if (!activeAccount || activeAccount.username !== usernameInput) {
        activeAccount = await invoke<Account>('login_offline', { username: usernameInput.trim() || 'Player' });
        setAccount(activeAccount);
      }

      let fullVersionId = selectedVersion;
      if (selectedLoader !== 'Vanilla') {
        setLaunchProgress(55);
        fullVersionId = await invoke<string>('install_mod_loader_cmd', {
          gameDir: config.game_dir,
          gameVersion: selectedVersion,
          loaderName: selectedLoader,
          loaderVersion: 'latest',
        });
      }

      setLaunchProgress(85);
      await invoke<number>('launch_minecraft', {
        versionId: fullVersionId,
        account: activeAccount,
        config,
      });

      setLaunchProgress(100);
      setTimeout(() => {
        setIsLaunching(false);
        setLaunchProgress(null);
      }, 2500);
    } catch (err: any) {
      setIsLaunching(false);
      setLaunchProgress(null);
      alert('Lỗi khởi chạy TLauncher Engine: ' + (err?.message || err));
    }
  };

  const handleOpenFolder = () => {
    invoke('plugin:opener|open_path', { path: config.game_dir }).catch(() => {
      alert(`Đường dẫn game: ${config.game_dir}`);
    });
  };

  return (
    <footer className="w-full bg-slate-900 border-t-2 border-amber-500/40 shadow-2xl relative z-40">
      {/* Launch Progress Overlay Bar */}
      {isLaunching && launchProgress !== null && (
        <div className="w-full h-1.5 bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-500 transition-all duration-300"
            style={{ width: `${launchProgress}%` }}
          />
        </div>
      )}

      <div className="px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left Section: Username & Accounts Checkbox */}
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-60">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-amber-500">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="Tên người dùng..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-amber-400 font-bold text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
            />
          </div>

          <label className="flex items-center space-x-2 text-xs font-bold text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={useAccounts}
              onChange={(e) => setUseAccounts(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 accent-amber-500 cursor-pointer"
            />
            <span>Tài khoản</span>
          </label>
        </div>

        {/* Center Section: Version Selector Dropdown & Refresh */}
        <div className="flex items-center space-x-3 w-full md:w-auto justify-center">
          <div className="relative w-64">
            <button
              onClick={() => setShowVersionDropdown(!showVersionDropdown)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-left flex items-center justify-between hover:border-amber-500/60 transition-all"
            >
              <div className="flex items-center space-x-2.5 truncate">
                <span className="w-5 h-5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-black flex items-center justify-center border border-amber-500/40">
                  TL
                </span>
                <span className="font-bold text-xs text-slate-100 truncate">
                  {selectedLoader !== 'Vanilla' ? `${selectedLoader} ` : ''}{selectedVersion}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-amber-500 transition-transform ${showVersionDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Version Menu */}
            {showVersionDropdown && (
              <div className="absolute bottom-full mb-2 left-0 right-0 max-h-60 overflow-y-auto rounded-xl bg-slate-950 border border-slate-800 shadow-2xl p-1.5 z-50 space-y-1">
                {versionsList.map((ver) => (
                  <button
                    key={ver}
                    onClick={() => {
                      setSelectedVersion(ver);
                      setShowVersionDropdown(false);
                    }}
                    className={`w-full p-2 rounded-lg text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                      selectedVersion === ver
                        ? 'bg-amber-500/20 text-amber-400 font-bold'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-amber-400">TL</span>
                      <span>Release {ver}</span>
                    </div>
                    {selectedVersion === ver && <Check className="w-4 h-4 text-amber-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => {}}
            className="p-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-amber-500 hover:bg-slate-800 hover:border-amber-500 transition-all"
            title="Tải lại danh sách phiên bản"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Center-Right Main Action: Iconic TLauncher ENTER THE GAME Button */}
        <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
          <button
            disabled={isLaunching}
            onClick={handlePlay}
            className={`px-8 py-3.5 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center space-x-2.5 transition-all shadow-xl ${
              isLaunching
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-amber-500/25 hover:scale-[1.03] active:scale-95 border-b-4 border-amber-700'
            }`}
          >
            {isLaunching ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                <span>ĐANG KHỞI CHẠY...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>ENTER THE GAME</span>
              </>
            )}
          </button>

          {/* TL MODS Button */}
          <button
            onClick={onOpenMods}
            className="px-4 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-600/20 border-b-4 border-emerald-800"
          >
            TL MODS
          </button>

          {/* Folder & Settings Quick Actions */}
          <div className="flex items-center space-x-1">
            <button
              onClick={handleOpenFolder}
              className="p-3 rounded-xl bg-slate-950 border border-slate-700/80 text-slate-300 hover:text-amber-400 hover:border-amber-500 transition-all"
              title="Mở thư mục Game (.minecraft)"
            >
              <Folder className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenSettings}
              className="p-3 rounded-xl bg-slate-950 border border-slate-700/80 text-slate-300 hover:text-amber-400 hover:border-amber-500 transition-all"
              title="Cấu hình TLauncher"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

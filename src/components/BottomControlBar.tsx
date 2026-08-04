import React, { useState } from 'react';
import { RotateCw, Folder, Settings } from 'lucide-react';
import { Account, AppConfig } from '../types';
import { AccountSelector } from './AccountSelector';
import { VersionSelector } from './VersionSelector';
import { PlayButton } from './PlayButton';
import { invoke } from '@tauri-apps/api/core';

interface BottomControlBarProps {
  config: AppConfig;
  account: Account | null;
  setAccount: (acc: Account) => void;
  selectedVersion: string;
  setSelectedVersion: (ver: string) => void;
  selectedLoader: string;
  setSelectedLoader: (loader: string) => void;
  versionsList: string[];
  onOpenSettings: () => void;
}

export const BottomControlBar: React.FC<BottomControlBarProps> = ({
  config,
  account,
  setAccount,
  selectedVersion,
  setSelectedVersion,
  selectedLoader,
  setSelectedLoader,
  versionsList,
  onOpenSettings,
}) => {
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchProgress, setLaunchProgress] = useState<number | null>(null);

  const handlePlay = async () => {
    setIsLaunching(true);
    setLaunchProgress(25);

    try {
      let activeAccount = account;
      if (!activeAccount) {
        activeAccount = await invoke<Account>('login_offline', { username: 'Player' });
        setAccount(activeAccount);
      }

      let fullVersionId = selectedVersion;
      if (selectedLoader !== 'Vanilla') {
        setLaunchProgress(60);
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
      alert('Khởi chạy thất bại: ' + (err?.message || err));
    }
  };

  const handleOpenFolder = () => {
    invoke('plugin:opener|open_path', { path: config.game_dir }).catch(() => {
      alert(`Thư mục game: ${config.game_dir}`);
    });
  };

  return (
    <footer className={`w-full border-t transition-colors duration-300 relative z-40 backdrop-blur-xl shadow-2xl ${
      config.theme === 'dark'
        ? 'bg-slate-900/95 border-slate-800 text-slate-100'
        : 'bg-white/95 border-slate-200 text-slate-800'
    }`}>
      {/* Launch Progress Overlay */}
      {isLaunching && launchProgress !== null && (
        <div className="w-full h-1.5 bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-600 transition-all duration-300"
            style={{ width: `${launchProgress}%` }}
          />
        </div>
      )}

      <div className="px-6 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left Section: Account Selector */}
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <AccountSelector
            account={account}
            setAccount={setAccount}
            config={config}
          />
        </div>

        {/* Center Section: Version Selector & Refresh */}
        <div className="flex items-center space-x-2 w-full md:w-auto justify-center">
          <VersionSelector
            selectedVersion={selectedVersion}
            setSelectedVersion={setSelectedVersion}
            selectedLoader={selectedLoader}
            setSelectedLoader={setSelectedLoader}
            versionsList={versionsList}
            config={config}
          />

          <button
            onClick={() => {}}
            className={`p-2.5 rounded-xl border transition-all ${
              config.theme === 'dark'
                ? 'bg-slate-950 border-slate-800 text-emerald-400 hover:bg-slate-800'
                : 'bg-white border-slate-300 text-emerald-600 hover:bg-slate-100 shadow-sm'
            }`}
            title="Tải lại danh sách"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Right Section: Main Play Button & Quick Action Icons */}
        <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
          <PlayButton
            isLaunching={isLaunching}
            onPlay={handlePlay}
            version={selectedVersion}
            loader={selectedLoader}
          />

          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleOpenFolder}
              className={`p-3 rounded-xl border transition-all ${
                config.theme === 'dark'
                  ? 'bg-slate-950 border-slate-800 text-slate-300 hover:text-emerald-400 hover:bg-slate-800'
                  : 'bg-white border-slate-300 text-slate-700 hover:text-emerald-600 hover:bg-slate-100 shadow-sm'
              }`}
              title="Mở thư mục .minecraft"
            >
              <Folder className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenSettings}
              className={`p-3 rounded-xl border transition-all ${
                config.theme === 'dark'
                  ? 'bg-slate-950 border-slate-800 text-slate-300 hover:text-emerald-400 hover:bg-slate-800'
                  : 'bg-white border-slate-300 text-slate-700 hover:text-emerald-600 hover:bg-slate-100 shadow-sm'
              }`}
              title="Cấu hình Launcher"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

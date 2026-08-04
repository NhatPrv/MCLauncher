import React, { useState } from 'react';
import { Play, Loader2, Sparkles, ShieldAlert } from 'lucide-react';
import { Account, AppConfig } from '../types';
import { invoke } from '@tauri-apps/api/core';

interface MainTabProps {
  config: AppConfig;
  account: Account | null;
  selectedVersion: string;
  setSelectedVersion: (ver: string) => void;
  selectedLoader: string;
  setSelectedLoader: (loader: string) => void;
  versionsList: string[];
}

export const MainTab: React.FC<MainTabProps> = ({
  config,
  account,
  selectedVersion,
  setSelectedVersion,
  selectedLoader,
  setSelectedLoader,
  versionsList,
}) => {
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchProgress, setLaunchProgress] = useState<number | null>(null);
  const [statusText, setStatusText] = useState<string>('');
  const [errorText, setErrorText] = useState<string | null>(null);

  const handlePlayGame = async () => {
    if (!account) {
      setErrorText('Vui lòng chọn hoặc tạo tài khoản trước khi chơi game!');
      return;
    }

    setErrorText(null);
    setIsLaunching(true);
    setStatusText('Đang kiểm tra phiên bản và dữ liệu game...');
    setLaunchProgress(20);

    try {
      // 1. Prepare version string
      let fullVersionId = selectedVersion;
      if (selectedLoader !== 'Vanilla') {
        setStatusText(`Đang tải & cấu hình Mod Loader ${selectedLoader}...`);
        setLaunchProgress(50);
        fullVersionId = await invoke<string>('install_mod_loader_cmd', {
          gameDir: config.game_dir,
          gameVersion: selectedVersion,
          loaderName: selectedLoader,
          loaderVersion: 'latest',
        });
      }

      setStatusText('Đang khởi chạy Minecraft Java Executable...');
      setLaunchProgress(85);

      // 2. Invoke launch command
      const pid = await invoke<number>('launch_minecraft', {
        versionId: fullVersionId,
        account,
        config,
      });

      setLaunchProgress(100);
      setStatusText(`Game đang chạy thành công! (PID: ${pid})`);
      setTimeout(() => {
        setIsLaunching(false);
        setLaunchProgress(null);
      }, 3000);
    } catch (err: any) {
      setIsLaunching(false);
      setLaunchProgress(null);
      setErrorText(typeof err === 'string' ? err : 'Khởi chạy thất bại: ' + (err?.message || JSON.stringify(err)));
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto flex flex-col justify-between relative">
      {/* Background Graphic Accent */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Header Banner */}
      <div className="space-y-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Sẵn sàng trải nghiệm Minecraft Tốc độ cao</span>
        </div>

        <h2 className="text-4xl font-extrabold tracking-tight">
          Chào mừng trở lại, <span className="text-emerald-400">{account?.username || 'Gamer'}</span>!
        </h2>
        <p className="text-slate-400 text-sm max-w-xl">
          Lựa chọn phiên bản Minecraft Vanilla hoặc Modded Loader yêu thích của bạn và bấm Chơi Game để trải nghiệm ngay lập tức.
        </p>
      </div>

      {/* Version Selector Cards */}
      <div className="my-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vanilla Version Box */}
        <div className={`p-5 rounded-2xl border transition-all ${
          config.theme === 'dark' ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200'
        }`}>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Phiên bản Game (Vanilla)
          </label>
          <select
            value={selectedVersion}
            onChange={(e) => setSelectedVersion(e.target.value)}
            className={`w-full p-3 rounded-xl border font-semibold outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
              config.theme === 'dark' 
                ? 'bg-slate-900 border-slate-700 text-slate-100' 
                : 'bg-slate-50 border-slate-300 text-slate-800'
            }`}
          >
            {versionsList.map((ver) => (
              <option key={ver} value={ver}>
                Minecraft {ver}
              </option>
            ))}
          </select>
        </div>

        {/* Mod Loader Box */}
        <div className={`p-5 rounded-2xl border transition-all ${
          config.theme === 'dark' ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200'
        }`}>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Mod Loader & Shaders Engine
          </label>
          <select
            value={selectedLoader}
            onChange={(e) => setSelectedLoader(e.target.value)}
            className={`w-full p-3 rounded-xl border font-semibold outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
              config.theme === 'dark' 
                ? 'bg-slate-900 border-slate-700 text-slate-100' 
                : 'bg-slate-50 border-slate-300 text-slate-800'
            }`}
          >
            <option value="Vanilla">Vanilla (Không Mod)</option>
            <option value="Fabric">Fabric Loader (Nhanh & Tối ưu)</option>
            <option value="Forge">Forge Loader (Phong phú Mods)</option>
            <option value="Quilt">Quilt Loader (Tiên tiến)</option>
            <option value="NeoForge">NeoForge (Modern Forge)</option>
            <option value="OptiFine">OptiFine (Tăng FPS)</option>
            <option value="Iris">Iris Shaders (Shaders Đồ Họa)</option>
          </select>
        </div>
      </div>

      {/* Error Display */}
      {errorText && (
        <div className="p-4 mb-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center space-x-3">
          <ShieldAlert className="w-5 h-5 flex-shrink-0" />
          <span>{errorText}</span>
        </div>
      )}

      {/* Launch Control Panel */}
      <div className={`p-6 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-6 ${
        config.theme === 'dark' ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200 shadow-xl'
      }`}>
        <div className="space-y-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start space-x-2">
            <span className="font-extrabold text-lg">Minecraft {selectedVersion}</span>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-400">
              {selectedLoader}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            {account ? `Tài khoản: ${account.username} (${account.account_type})` : 'Chưa có tài khoản đăng nhập'}
          </p>
        </div>

        {/* Play Button */}
        <button
          disabled={isLaunching}
          onClick={handlePlayGame}
          className={`w-full md:w-auto px-10 py-4 rounded-2xl font-black text-lg flex items-center justify-center space-x-3 transition-all duration-300 ${
            isLaunching
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-400 hover:to-green-500 text-white shadow-xl shadow-green-500/30 hover:scale-105 active:scale-95'
          }`}
        >
          {isLaunching ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>ĐANG KHỞI CHẠY...</span>
            </>
          ) : (
            <>
              <Play className="w-6 h-6 fill-current" />
              <span>BẮT ĐẦU CHƠI GAME</span>
            </>
          )}
        </button>
      </div>

      {/* Progress Bar overlay */}
      {isLaunching && launchProgress !== null && (
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-xs text-slate-400 font-medium">
            <span>{statusText}</span>
            <span>{launchProgress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-300"
              style={{ width: `${launchProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

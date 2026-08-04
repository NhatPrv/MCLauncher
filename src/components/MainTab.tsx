import React, { useState } from 'react';
import { Play, Loader2, Sparkles, ShieldAlert, Cpu, Layers } from 'lucide-react';
import { Account, AppConfig } from '../types';
import { CustomDropdown, DropdownOption } from './CustomDropdown';
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

  // Prepare options for Version Custom Dropdown
  const versionOptions: DropdownOption[] = versionsList.map((ver) => ({
    value: ver,
    label: `Minecraft ${ver}`,
    badge: ver === versionsList[0] ? 'Mới Nhất' : undefined,
    icon: '📦',
  }));

  // Prepare options for Mod Loader Custom Dropdown
  const loaderOptions: DropdownOption[] = [
    { value: 'Vanilla', label: 'Vanilla Standard', description: 'Nguyên bản không mod', icon: '📦' },
    { value: 'Fabric', label: 'Fabric Loader', description: 'Siêu nhẹ & Tối ưu FPS', badge: 'Khuyên Dùng', icon: '⚡' },
    { value: 'Forge', label: 'Minecraft Forge', description: 'Phong phú mods truyền thống', icon: '🔨' },
    { value: 'Quilt', label: 'Quilt Loader', description: 'Mod loader mô-đun tiên tiến', icon: '🍃' },
    { value: 'NeoForge', label: 'NeoForge', description: 'Modern Forge ecosystem', icon: '💥' },
    { value: 'OptiFine', label: 'OptiFine HD', description: 'Tăng FPS & Tùy biến đồ họa', icon: '🔍' },
    { value: 'Iris', label: 'Iris Shaders', description: 'Shaders đồ họa tốc độ cao', icon: '✨' },
  ];

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
      {/* Dynamic Background Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Header Banner */}
      <div className="space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>MCLauncher Engine v1.0 • Safe & Clean</span>
        </div>

        <h2 className="text-4xl font-black tracking-tight">
          Chào mừng, <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-green-300">{account?.username || 'Gamer'}</span>!
        </h2>
        <p className="text-slate-400 text-sm max-w-xl">
          Lựa chọn phiên bản game và bộ khởi chạy Mod bằng hệ thống Dropdown tùy chỉnh bên dưới.
        </p>
      </div>

      {/* Custom Dropdown Selection Cards */}
      <div className="my-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Version Dropdown Box */}
        <div className={`p-6 rounded-2xl border transition-all ${
          config.theme === 'dark' ? 'bg-slate-800/60 border-slate-700/80' : 'bg-white border-slate-200 shadow-md'
        }`}>
          <div className="flex items-center space-x-2 mb-3">
            <Layers className="w-4 h-4 text-emerald-400" />
            <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              Phiên Bản Minecraft (Vanilla)
            </label>
          </div>
          <CustomDropdown
            options={versionOptions}
            value={selectedVersion}
            onChange={setSelectedVersion}
            searchable={true}
            theme={config.theme}
          />
        </div>

        {/* Mod Loader Dropdown Box */}
        <div className={`p-6 rounded-2xl border transition-all ${
          config.theme === 'dark' ? 'bg-slate-800/60 border-slate-700/80' : 'bg-white border-slate-200 shadow-md'
        }`}>
          <div className="flex items-center space-x-2 mb-3">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              Mod Loader & Shader Engine
            </label>
          </div>
          <CustomDropdown
            options={loaderOptions}
            value={selectedLoader}
            onChange={setSelectedLoader}
            theme={config.theme}
          />
        </div>
      </div>

      {/* Error Alert */}
      {errorText && (
        <div className="p-4 mb-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center space-x-3">
          <ShieldAlert className="w-5 h-5 flex-shrink-0" />
          <span>{errorText}</span>
        </div>
      )}

      {/* Launch Control Panel */}
      <div className={`p-6 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl ${
        config.theme === 'dark'
          ? 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-slate-700'
          : 'bg-white border-slate-200'
      }`}>
        <div className="space-y-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start space-x-2">
            <span className="font-black text-xl tracking-tight">Minecraft {selectedVersion}</span>
            <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {selectedLoader}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium">
            {account ? `Tài khoản: ${account.username} (${account.account_type})` : 'Chưa chọn tài khoản đăng nhập'}
          </p>
        </div>

        {/* Play Button */}
        <button
          disabled={isLaunching}
          onClick={handlePlayGame}
          className={`w-full md:w-auto px-12 py-4 rounded-2xl font-black text-lg flex items-center justify-center space-x-3 transition-all duration-300 relative overflow-hidden ${
            isLaunching
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-400 hover:to-green-500 text-white shadow-xl shadow-green-500/30 hover:scale-[1.03] active:scale-95'
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
          <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
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

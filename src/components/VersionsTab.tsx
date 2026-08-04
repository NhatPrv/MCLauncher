import React, { useState } from 'react';
import { Download, Check } from 'lucide-react';
import { AppConfig } from '../types';
import { invoke } from '@tauri-apps/api/core';

interface VersionsTabProps {
  config: AppConfig;
  selectedVersion: string;
  selectedLoader: string;
  setSelectedLoader: (loader: string) => void;
}

export const VersionsTab: React.FC<VersionsTabProps> = ({
  config,
  selectedVersion,
  selectedLoader,
  setSelectedLoader,
}) => {
  const [installing, setInstalling] = useState<string | null>(null);
  const [installedNotice, setInstalledNotice] = useState<string | null>(null);

  const modLoaders = [
    { id: 'Vanilla', name: 'Vanilla Standard', desc: 'Phiên bản gốc Mojang, nguyên bản không sửa đổi.', icon: '📦' },
    { id: 'Fabric', name: 'Fabric Loader', desc: 'Mod loader thế hệ mới nhẹ, siêu tối ưu FPS và hỗ trợ mods phong phú.', icon: '⚡' },
    { id: 'Forge', name: 'Minecraft Forge', desc: 'Mod loader truyền thống giàu tính năng cho các Modpack lớn.', icon: '🔨' },
    { id: 'Quilt', name: 'Quilt Loader', desc: 'Dự án mod loader hiện đại kế thừa từ Fabric với thiết kế mô-đun.', icon: '🍃' },
    { id: 'NeoForge', name: 'NeoForge', desc: 'Hệ sinh thái Forge thế hệ mới cho các bản Minecraft hiện đại.', icon: '💥' },
    { id: 'OptiFine', name: 'OptiFine HD', desc: 'Tối ưu hóa đồ họa, hỗ trợ HD Textures & gia tăng FPS tối đa.', icon: '🔍' },
    { id: 'Iris', name: 'Iris Shaders', desc: 'Công nghệ render Shaders tốc độ cao tương thích cực tốt với Fabric.', icon: '✨' },
  ];

  const handleInstallLoader = async (loaderId: string) => {
    setInstalling(loaderId);
    setInstalledNotice(null);
    try {
      await invoke('install_mod_loader_cmd', {
        gameDir: config.game_dir,
        gameVersion: selectedVersion,
        loaderName: loaderId,
        loaderVersion: 'latest',
      });
      setSelectedLoader(loaderId);
      setInstalledNotice(`Đã cài đặt thành công ${loaderId} cho Minecraft ${selectedVersion}!`);
    } catch (err: any) {
      alert('Lỗi cài đặt: ' + (err?.message || err));
    } finally {
      setInstalling(null);
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Quản Lý Phiên Bản & Mod Loaders</h2>
        <p className="text-slate-400 text-sm mt-1">
          Tải xuống và cài đặt tự động các bộ khởi chạy Mod tương thích hoàn hảo với Minecraft.
        </p>
      </div>

      {installedNotice && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center space-x-2">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span>{installedNotice}</span>
        </div>
      )}

      {/* Grid of Mod Loaders */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {modLoaders.map((loader) => {
          const isSelected = selectedLoader === loader.id;
          const isCurrentInstalling = installing === loader.id;

          return (
            <div
              key={loader.id}
              className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20'
                  : config.theme === 'dark'
                  ? 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">{loader.icon}</span>
                  {isSelected && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white flex items-center space-x-1">
                      <Check className="w-3 h-3" />
                      <span>Đang chọn</span>
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-lg">{loader.name}</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{loader.desc}</p>
              </div>

              <button
                disabled={isCurrentInstalling}
                onClick={() => handleInstallLoader(loader.id)}
                className={`mt-6 w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all ${
                  isSelected
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : config.theme === 'dark'
                    ? 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                }`}
              >
                {isCurrentInstalling ? (
                  <span>Đang cài đặt...</span>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>{isSelected ? 'Cài Lại' : 'Cài Đặt Tự Động'}</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

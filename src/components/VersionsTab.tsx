import React, { useState } from 'react';
import { Check, Download, Box, Hammer, Zap } from 'lucide-react';
import { AppConfig } from '../types';
import { OptionCard } from './OptionCard';
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

  const vanillaLoaders = [
    { id: 'Vanilla', title: 'Vanilla Standard', desc: 'Phiên bản gốc Mojang, nguyên bản không sửa đổi.', icon: '📦', badge: 'Gốc Mojang' },
  ];

  const forgeLoaders = [
    { id: 'Forge', title: 'Minecraft Forge', desc: 'Mod loader truyền thống giàu tính năng cho các Modpack lớn.', icon: '🔨', badge: 'Forge Chính Thức' },
    { id: 'NeoForge', title: 'NeoForge', desc: 'Hệ sinh thái Forge thế hệ mới tối ưu cho các bản Minecraft hiện đại.', icon: '💥', badge: 'NeoForge Mới' },
  ];

  const fabricLoaders = [
    { id: 'Fabric', title: 'Fabric Loader', desc: 'Mod loader thế hệ mới nhẹ, siêu tối ưu FPS và hỗ trợ mods phong phú.', icon: '⚡', badge: 'Khuyên Dùng' },
    { id: 'Iris', title: 'Iris Shaders & Sodium', desc: 'Công nghệ render Shaders tốc độ cao tương thích cực tốt với Fabric.', icon: '✨', badge: 'Graphics & FPS' },
    { id: 'OptiFine', title: 'OptiFine HD', desc: 'Tối ưu hóa đồ họa, hỗ trợ HD Textures & gia tăng FPS tối đa.', icon: '🔍', badge: 'FPS Booster' },
    { id: 'Quilt', title: 'Quilt Loader', desc: 'Dự án mod loader hiện đại kế thừa từ Fabric với thiết kế mô-đun.', icon: '🍃', badge: 'Hiện Đại' },
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

  const renderLoaderGroup = (title: string, subtitle: string, icon: React.ReactNode, loaders: typeof vanillaLoaders, borderColor: string) => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: config.theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
        <div className="p-2 rounded-xl" style={{ background: `${borderColor}15`, color: borderColor }}>
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-black tracking-tight" style={{ color: config.theme === 'dark' ? '#f8fafc' : '#0f172a' }}>{title}</h3>
          <p className="text-xs text-slate-400 font-medium">{subtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loaders.map((loader) => {
          const isSelected = selectedLoader === loader.id;
          const isCurrentInstalling = installing === loader.id;

          return (
            <div key={loader.id} className="flex flex-col justify-between">
              <OptionCard
                title={loader.title}
                description={loader.desc}
                icon={loader.icon}
                badge={loader.badge}
                selected={isSelected}
                onSelect={() => setSelectedLoader(loader.id)}
                theme={config.theme}
                className="h-full"
              />

              <button
                disabled={isCurrentInstalling}
                onClick={() => handleInstallLoader(loader.id)}
                className={`mt-3 w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all ${
                  isSelected
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20'
                    : config.theme === 'dark'
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {isCurrentInstalling ? (
                  <span>Đang cài đặt...</span>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>{isSelected ? 'Tải Lại Engine' : 'Cài Đặt Tự Động'}</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="flex-1 p-8 overflow-y-auto space-y-10">
      <div>
        <h2 className="text-3xl font-black tracking-tight">Quản Lý Mod Loaders & Engine Graphics</h2>
        <p className="text-slate-400 text-sm mt-1">
          Các danh mục đã được phân loại riêng biệt cho phiên bản <span className="text-emerald-400 font-bold">Minecraft {selectedVersion}</span>.
        </p>
      </div>

      {installedNotice && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center space-x-2">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span>{installedNotice}</span>
        </div>
      )}

      {/* SECTION 1: VANILLA */}
      {renderLoaderGroup(
        '1. Mục Minecraft Vanilla (Gốc)',
        'Phiên bản thuần nguyên bản chính thức từ Mojang Studios.',
        <Box size={20} />,
        vanillaLoaders,
        '#10b981'
      )}

      {/* SECTION 2: FORGE & NEOFORGE */}
      {renderLoaderGroup(
        '2. Mục Hệ Sinh Thái Forge & NeoForge',
        'Nền tảng Mod loader truyền thống hỗ trợ hàng ngàn Modpack phong phú.',
        <Hammer size={20} />,
        forgeLoaders,
        '#f59e0b'
      )}

      {/* SECTION 3: FABRIC & IRIS SHADERS */}
      {renderLoaderGroup(
        '3. Mục Hệ Sinh Thái Fabric & Iris Shaders',
        'Nền tảng siêu nhẹ tối ưu FPS cao kết hợp công nghệ Render Shaders thế hệ mới.',
        <Zap size={20} />,
        fabricLoaders,
        '#3b82f6'
      )}
    </div>
  );
};

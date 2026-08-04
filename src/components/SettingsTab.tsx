import React, { useState } from 'react';
import { Cpu, HardDrive, Monitor, Save, Search, Check } from 'lucide-react';
import { AppConfig } from '../types';
import { OptionCard } from './OptionCard';
import { invoke } from '@tauri-apps/api/core';

interface SettingsTabProps {
  config: AppConfig;
  setConfig: React.Dispatch<React.SetStateAction<AppConfig>>;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ config, setConfig }) => {
  const [savedNotice, setSavedNotice] = useState(false);

  const ramPresets = [
    { label: '2 GB', min: 1024, max: 2048, desc: 'Máy nhẹ / Cấu hình thấp' },
    { label: '4 GB', min: 2048, max: 4096, desc: 'Tiêu chuẩn Minecraft (Khuyên dùng)' },
    { label: '8 GB', min: 4096, max: 8192, desc: 'Nhiều Mods & Shaders đồ họa' },
    { label: '16 GB', min: 8192, max: 16384, desc: 'Modpack nặng / 4K Shaders' },
  ];

  const handleSave = async () => {
    try {
      await invoke('update_config', { config });
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
    } catch (err: any) {
      alert('Lỗi lưu cấu hình: ' + err);
    }
  };

  const handleAutoDetectJava = async () => {
    try {
      const path = await invoke<string | null>('auto_detect_java');
      if (path) {
        setConfig({ ...config, java_path: path });
      } else {
        alert('Không tìm thấy bản cài đặt Java tự động trên hệ thống.');
      }
    } catch (err: any) {
      alert('Lỗi quét Java: ' + err);
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Cấu Hình Game & Hệ Thống</h2>
          <p className="text-slate-400 text-sm mt-1">
            Tùy chỉnh phân bổ RAM, đường dẫn Java Executable, Resolution và JVM Flags.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center space-x-2 shadow-lg shadow-emerald-600/20 transition-all"
        >
          <Save className="w-4 h-4" />
          <span>Lưu Cấu Hình</span>
        </button>
      </div>

      {savedNotice && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center space-x-2">
          <Check className="w-5 h-5" />
          <span>Đã lưu thành công các cài đặt cấu hình!</span>
        </div>
      )}

      {/* RAM Presets Cards */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Cpu className="w-5 h-5 text-emerald-400" />
          <h3 className="font-extrabold text-base">Preset Phân Bổ Bộ Nhớ RAM</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ramPresets.map((preset) => {
            const isSelected = config.max_ram_mb === preset.max;
            return (
              <OptionCard
                key={preset.label}
                title={preset.label}
                description={preset.desc}
                selected={isSelected}
                onSelect={() =>
                  setConfig({
                    ...config,
                    min_ram_mb: preset.min,
                    max_ram_mb: preset.max,
                  })
                }
                theme={config.theme}
              />
            );
          })}
        </div>

        {/* Custom RAM Sliders */}
        <div className={`p-6 rounded-2xl border ${
          config.theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                RAM Tối Thiểu (Min RAM): <span className="text-emerald-400 font-extrabold">{config.min_ram_mb} MB</span>
              </label>
              <input
                type="range"
                min="512"
                max="8192"
                step="512"
                value={config.min_ram_mb}
                onChange={(e) => setConfig({ ...config, min_ram_mb: Number(e.target.value) })}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                RAM Tối Đa (Max RAM): <span className="text-emerald-400 font-extrabold">{config.max_ram_mb} MB</span>
              </label>
              <input
                type="range"
                min="1024"
                max="16384"
                step="512"
                value={config.max_ram_mb}
                onChange={(e) => setConfig({ ...config, max_ram_mb: Number(e.target.value) })}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Java Executable Path */}
      <div className={`p-6 rounded-2xl border ${
        config.theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center space-x-3 mb-4">
          <HardDrive className="w-5 h-5 text-emerald-400" />
          <h3 className="font-bold text-base">Đường Dẫn Java Executable (java.exe)</h3>
        </div>

        <div className="flex gap-3">
          <input
            type="text"
            value={config.java_path}
            onChange={(e) => setConfig({ ...config, java_path: e.target.value })}
            placeholder="C:\Program Files\Java\jdk-17\bin\java.exe"
            className={`flex-1 p-3.5 rounded-xl border font-mono text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
              config.theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-800'
            }`}
          />
          <button
            onClick={handleAutoDetectJava}
            className={`px-4 py-3.5 rounded-xl border font-bold text-xs flex items-center space-x-2 transition-all ${
              config.theme === 'dark'
                ? 'bg-slate-700 border-slate-600 hover:bg-slate-600 text-slate-200'
                : 'bg-slate-100 border-slate-300 hover:bg-slate-200 text-slate-800'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Tự Động Quét</span>
          </button>
        </div>
      </div>

      {/* Resolution */}
      <div className={`p-6 rounded-2xl border ${
        config.theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center space-x-3 mb-4">
          <Monitor className="w-5 h-5 text-emerald-400" />
          <h3 className="font-bold text-base">Độ Phân Giải Cửa Sổ Game</h3>
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-md">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Width (px)
            </label>
            <input
              type="number"
              value={config.resolution_width}
              onChange={(e) => setConfig({ ...config, resolution_width: Number(e.target.value) })}
              className={`w-full p-3 rounded-xl border font-semibold outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                config.theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-800'
              }`}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Height (px)
            </label>
            <input
              type="number"
              value={config.resolution_height}
              onChange={(e) => setConfig({ ...config, resolution_height: Number(e.target.value) })}
              className={`w-full p-3 rounded-xl border font-semibold outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                config.theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-800'
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

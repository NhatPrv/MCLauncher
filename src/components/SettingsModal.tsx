import React from 'react';
import { X, Cpu, HardDrive, Monitor, Search } from 'lucide-react';
import { AppConfig } from '../types';
import { invoke } from '@tauri-apps/api/core';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  setConfig: React.Dispatch<React.SetStateAction<AppConfig>>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  setConfig,
}) => {
  if (!isOpen) return null;

  const handleSave = async () => {
    try {
      await invoke('update_config', { config });
      onClose();
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
        alert('Không tìm thấy bản cài đặt Java tự động.');
      }
    } catch (err: any) {
      alert('Lỗi quét Java: ' + err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className={`w-full max-w-2xl border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors ${
        config.theme === 'dark'
          ? 'bg-slate-900 border-slate-800 text-slate-100'
          : 'bg-white border-slate-200 text-slate-800'
      }`}>
        {/* Modal Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          config.theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center space-x-2">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-500 to-green-400 text-white font-black text-xs flex items-center justify-center">
              MC
            </span>
            <h3 className="font-extrabold text-base tracking-tight">Cấu Hình Launcher & Game Engine</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* RAM Allocation */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-emerald-500" />
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Phân Bổ Bộ Nhớ RAM (Max RAM)
              </label>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>RAM Khuyên Dùng: 4096 MB</span>
              <span className="text-emerald-400 font-extrabold text-sm">{config.max_ram_mb} MB</span>
            </div>
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

          {/* Java Path */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <HardDrive className="w-4 h-4 text-emerald-500" />
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Đường Dẫn Java Executable
              </label>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={config.java_path}
                onChange={(e) => setConfig({ ...config, java_path: e.target.value })}
                placeholder="javaw.exe"
                className={`flex-1 p-3 rounded-xl border text-xs font-mono outline-none focus:border-emerald-500 transition-all ${
                  config.theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                }`}
              />
              <button
                onClick={handleAutoDetectJava}
                className={`px-4 py-3 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all ${
                  config.theme === 'dark'
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                }`}
              >
                <Search className="w-4 h-4" />
                <span>Quét Java</span>
              </button>
            </div>
          </div>

          {/* Resolution */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Monitor className="w-4 h-4 text-emerald-500" />
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Độ Phân Giải Màn Hình Game
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                value={config.resolution_width}
                onChange={(e) => setConfig({ ...config, resolution_width: Number(e.target.value) })}
                className={`p-3 rounded-xl border text-xs font-semibold outline-none focus:border-emerald-500 transition-all ${
                  config.theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                }`}
                placeholder="Width"
              />
              <input
                type="number"
                value={config.resolution_height}
                onChange={(e) => setConfig({ ...config, resolution_height: Number(e.target.value) })}
                className={`p-3 rounded-xl border text-xs font-semibold outline-none focus:border-emerald-500 transition-all ${
                  config.theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                }`}
                placeholder="Height"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className={`px-6 py-4 border-t flex items-center justify-end space-x-3 ${
          config.theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-bold text-xs text-slate-400 hover:text-white transition-colors"
          >
            Hủy Bỏ
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/25 transition-all"
          >
            Lưu Cấu Hình
          </button>
        </div>
      </div>
    </div>
  );
};

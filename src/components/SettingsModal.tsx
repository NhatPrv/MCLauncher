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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
              TL
            </span>
            <h3 className="font-extrabold text-base text-slate-100">Cấu Hình TLauncher Engine</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* RAM Allocation */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-amber-500" />
              <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">
                Dung Lượng Bộ Nhớ RAM Allocation
              </label>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>RAM Khuyên Dùng: 4096 MB</span>
              <span className="text-amber-400 font-bold">{config.max_ram_mb} MB</span>
            </div>
            <input
              type="range"
              min="1024"
              max="16384"
              step="512"
              value={config.max_ram_mb}
              onChange={(e) => setConfig({ ...config, max_ram_mb: Number(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Java Path */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <HardDrive className="w-4 h-4 text-amber-500" />
              <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">
                Đường Dẫn Java Executable
              </label>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={config.java_path}
                onChange={(e) => setConfig({ ...config, java_path: e.target.value })}
                placeholder="javaw.exe"
                className="flex-1 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 outline-none focus:border-amber-500"
              />
              <button
                onClick={handleAutoDetectJava}
                className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-xs text-slate-200 flex items-center space-x-1"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Quét</span>
              </button>
            </div>
          </div>

          {/* Resolution */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Monitor className="w-4 h-4 text-amber-500" />
              <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">
                Độ Phân Giải Màn Hình Game
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                value={config.resolution_width}
                onChange={(e) => setConfig({ ...config, resolution_width: Number(e.target.value) })}
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-200 outline-none focus:border-amber-500"
                placeholder="Width"
              />
              <input
                type="number"
                value={config.resolution_height}
                onChange={(e) => setConfig({ ...config, resolution_height: Number(e.target.value) })}
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-200 outline-none focus:border-amber-500"
                placeholder="Height"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-xs text-slate-300"
          >
            Hủy Bỏ
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 font-black text-xs text-slate-950 shadow-md shadow-amber-500/20"
          >
            Lưu Cấu Hình
          </button>
        </div>
      </div>
    </div>
  );
};

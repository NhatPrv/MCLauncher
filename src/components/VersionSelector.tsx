import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';
import { AppConfig } from '../types';

interface VersionSelectorProps {
  selectedVersion: string;
  setSelectedVersion: (ver: string) => void;
  selectedLoader: string;
  setSelectedLoader: (loader: string) => void;
  versionsList: string[];
  config: AppConfig;
}

export const VersionSelector: React.FC<VersionSelectorProps> = ({
  selectedVersion,
  setSelectedVersion,
  selectedLoader,
  setSelectedLoader,
  versionsList,
  config,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loaderIcons: Record<string, string> = {
    Vanilla: '📦',
    Fabric: '⚡',
    Forge: '🔨',
    Quilt: '🍃',
    NeoForge: '💥',
    OptiFine: '🔍',
    Iris: '✨',
  };

  const filteredVersions = versionsList.filter((ver) =>
    ver.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative min-w-[240px]" ref={dropdownRef}>
      {/* Selector Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3.5 py-2.5 rounded-xl border flex items-center justify-between space-x-3 transition-all duration-200 ${
          config.theme === 'dark'
            ? 'bg-slate-950 border-slate-800 hover:border-emerald-500/50 text-slate-100'
            : 'bg-white border-slate-300 hover:border-emerald-500/50 text-slate-800 shadow-sm'
        }`}
      >
        <div className="flex items-center space-x-2.5 truncate">
          <span className="text-lg">{loaderIcons[selectedLoader] || '📦'}</span>
          <div className="text-left truncate">
            <div className="text-xs font-extrabold truncate leading-none">
              Minecraft {selectedVersion}
            </div>
            <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">
              Engine: {selectedLoader}
            </div>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-emerald-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className={`absolute bottom-full mb-2 left-0 right-0 w-80 p-3 rounded-2xl border shadow-2xl z-50 animate-in fade-in duration-150 backdrop-blur-xl ${
          config.theme === 'dark' ? 'bg-slate-900/95 border-slate-800 text-slate-100' : 'bg-white/95 border-slate-200 text-slate-800'
        }`}>
          {/* Mod Loader Selector Tabs */}
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
            Bộ Khởi Chạy (Mod Loader)
          </div>

          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {['Vanilla', 'Fabric', 'Forge', 'OptiFine', 'Quilt', 'NeoForge'].map((loader) => (
              <button
                key={loader}
                onClick={() => setSelectedLoader(loader)}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center space-x-1 border transition-all ${
                  selectedLoader === loader
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                    : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{loaderIcons[loader]}</span>
                <span>{loader}</span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="p-2 mb-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center space-x-2">
            <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm phiên bản..."
              className="w-full bg-transparent text-xs font-semibold outline-none text-slate-200 placeholder-slate-400"
            />
          </div>

          {/* Version List */}
          <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
            {filteredVersions.map((ver) => {
              const isSelected = selectedVersion === ver;
              return (
                <button
                  key={ver}
                  onClick={() => {
                    setSelectedVersion(ver);
                    setIsOpen(false);
                  }}
                  className={`w-full p-2 rounded-lg text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-emerald-500/15 text-emerald-400 font-bold'
                      : 'hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span>{loaderIcons[selectedLoader]}</span>
                    <span>Release {ver}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { Play, Loader2 } from 'lucide-react';

interface PlayButtonProps {
  isLaunching: boolean;
  onPlay: () => void;
  version: string;
  loader?: string;
}

export const PlayButton: React.FC<PlayButtonProps> = ({
  isLaunching,
  onPlay,
  version,
}) => {
  return (
    <button
      disabled={isLaunching}
      onClick={onPlay}
      className={`px-10 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center space-x-3 transition-all duration-300 relative overflow-hidden shadow-2xl ${
        isLaunching
          ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
          : 'bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-400 hover:to-green-400 text-white shadow-emerald-500/35 hover:scale-[1.04] active:scale-95 border-b-4 border-emerald-800 ring-2 ring-emerald-400/20'
      }`}
    >
      {isLaunching ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
          <span>ĐANG KHỞI CHẠY...</span>
        </>
      ) : (
        <>
          <Play className="w-5 h-5 fill-current" />
          <span>VÀO GAME ({version})</span>
        </>
      )}
    </button>
  );
};

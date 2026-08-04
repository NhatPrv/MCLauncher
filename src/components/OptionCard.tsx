import React from 'react';
import { Check } from 'lucide-react';

interface OptionCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode | string;
  selected: boolean;
  onSelect: () => void;
  badge?: string;
  theme?: 'dark' | 'light';
  className?: string;
}

export const OptionCard: React.FC<OptionCardProps> = ({
  title,
  description,
  icon,
  selected,
  onSelect,
  badge,
  theme = 'dark',
  className = '',
}) => {
  return (
    <div
      onClick={onSelect}
      className={`relative p-5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between group ${
        selected
          ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/10 scale-[1.01]'
          : theme === 'dark'
          ? 'bg-slate-800/50 border-slate-700/80 hover:border-slate-600 hover:bg-slate-800/80'
          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-sm'
      } ${className}`}
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          {icon && (
            typeof icon === 'string' ? (
              <span className="text-3xl">{icon}</span>
            ) : (
              <div className={`p-2.5 rounded-xl ${selected ? 'bg-emerald-500 text-white' : 'bg-slate-700/50 text-slate-300'}`}>
                {icon}
              </div>
            )
          )}
          
          <div className="flex items-center space-x-2">
            {badge && (
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                selected ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'
              }`}>
                {badge}
              </span>
            )}
            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
              selected ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-600 bg-slate-800/50'
            }`}>
              {selected && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          </div>
        </div>

        <h4 className="font-bold text-sm tracking-wide group-hover:text-emerald-400 transition-colors">
          {title}
        </h4>
        {description && (
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

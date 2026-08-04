import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
  badge?: string;
  description?: string;
  icon?: string | React.ReactNode;
}

interface CustomDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  searchable?: boolean;
  theme?: 'dark' | 'light';
  className?: string;
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Chọn một tùy chọn...',
  searchable = false,
  theme = 'dark',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (opt.description && opt.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full p-3.5 rounded-xl border flex items-center justify-between transition-all duration-200 shadow-sm ${
          theme === 'dark'
            ? 'bg-slate-900/90 border-slate-700/80 text-slate-100 hover:border-emerald-500/50 hover:bg-slate-800/90'
            : 'bg-white border-slate-300 text-slate-800 hover:border-emerald-500/50 hover:bg-slate-50'
        } ${isOpen ? 'ring-2 ring-emerald-500/30 border-emerald-500' : ''}`}
      >
        <div className="flex items-center space-x-3 truncate">
          {selectedOption?.icon && <span className="text-xl flex-shrink-0">{selectedOption.icon}</span>}
          <div className="truncate text-left">
            <div className="font-bold text-sm truncate">
              {selectedOption ? selectedOption.label : placeholder}
            </div>
            {selectedOption?.description && (
              <div className="text-[11px] text-slate-400 truncate mt-0.5">
                {selectedOption.description}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
          {selectedOption?.badge && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-400">
              {selectedOption.badge}
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-emerald-400' : ''}`} />
        </div>
      </button>

      {/* Menu Options Popover */}
      {isOpen && (
        <div
          className={`absolute left-0 right-0 mt-2 z-50 rounded-xl border shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 ${
            theme === 'dark'
              ? 'bg-slate-900/95 border-slate-700/80 text-slate-100'
              : 'bg-white/95 border-slate-200 text-slate-800'
          }`}
        >
          {searchable && (
            <div className="p-2 border-b border-slate-700/50 flex items-center space-x-2 px-3">
              <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm..."
                className="w-full bg-transparent text-xs py-1.5 font-medium outline-none text-slate-200 placeholder-slate-400"
                autoFocus
              />
            </div>
          )}

          <div className="max-h-60 overflow-y-auto p-1.5 space-y-1">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 font-medium">
                Không tìm thấy tùy chọn phù hợp
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={`w-full p-2.5 rounded-lg flex items-center justify-between text-left transition-all ${
                      isSelected
                        ? 'bg-emerald-500/15 text-emerald-400 font-bold'
                        : theme === 'dark'
                        ? 'hover:bg-slate-800 text-slate-200'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3 truncate">
                      {opt.icon && <span className="text-lg">{opt.icon}</span>}
                      <div className="truncate">
                        <div className="text-xs font-semibold">{opt.label}</div>
                        {opt.description && (
                          <div className="text-[10px] text-slate-400 mt-0.5">{opt.description}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-2">
                      {opt.badge && (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-800 text-slate-300">
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

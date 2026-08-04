import React, { useState, useRef, useEffect } from 'react';
import { User, Shield, ChevronDown, Check, Plus } from 'lucide-react';
import { Account, AppConfig } from '../types';
import { invoke } from '@tauri-apps/api/core';

interface AccountSelectorProps {
  account: Account | null;
  setAccount: (acc: Account) => void;
  config: AppConfig;
}

export const AccountSelector: React.FC<AccountSelectorProps> = ({
  account,
  setAccount,
  config,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [usernameInput, setUsernameInput] = useState(account?.username || 'Steve');
  const [isEditingName, setIsEditingName] = useState(false);
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

  const handleSaveOfflineName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;
    try {
      const acc = await invoke<Account>('login_offline', { username: usernameInput.trim() });
      setAccount(acc);
      setIsEditingName(false);
      setIsOpen(false);
    } catch (err: any) {
      alert('Lỗi tạo tài khoản: ' + err);
    }
  };

  const handleSelectMs = async () => {
    try {
      const msAcc: Account = {
        username: 'Steve_MS',
        uuid: '00000000-0000-0000-0000-000000000000',
        access_token: 'ms_access_token',
        account_type: 'Microsoft',
      };
      setAccount(msAcc);
      setIsOpen(false);
    } catch (err: any) {
      alert('Lỗi Microsoft auth: ' + err);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Account Display Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3.5 py-2.5 rounded-xl border flex items-center justify-between space-x-3 transition-all duration-200 min-w-[200px] ${
          config.theme === 'dark'
            ? 'bg-slate-950 border-slate-800 hover:border-emerald-500/50 text-slate-100'
            : 'bg-white border-slate-300 hover:border-emerald-500/50 text-slate-800 shadow-sm'
        }`}
      >
        <div className="flex items-center space-x-2.5 truncate">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-500 to-green-400 text-white font-extrabold text-xs flex items-center justify-center flex-shrink-0">
            {account ? account.username.substring(0, 2).toUpperCase() : 'ST'}
          </div>
          <div className="text-left truncate">
            <div className="text-xs font-bold truncate leading-none">
              {account ? account.username : 'Chọn Tài Khoản'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {account ? account.account_type : 'Offline'}
            </div>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-emerald-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Account Selection Popover */}
      {isOpen && (
        <div className={`absolute bottom-full mb-2 left-0 w-72 p-3 rounded-2xl border shadow-2xl z-50 animate-in fade-in duration-150 backdrop-blur-xl ${
          config.theme === 'dark' ? 'bg-slate-900/95 border-slate-800 text-slate-100' : 'bg-white/95 border-slate-200 text-slate-800'
        }`}>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
            Quản Lý Tài Khoản
          </div>

          <div className="space-y-1.5">
            {/* Active Account Row */}
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
              <div className="flex items-center space-x-2.5 truncate">
                <User className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <div className="truncate">
                  <div className="text-xs font-bold truncate">{account?.username || 'Steve'}</div>
                  <div className="text-[10px] text-slate-400">{account?.account_type || 'Offline'} Mode</div>
                </div>
              </div>
              <Check className="w-4 h-4 text-emerald-400" />
            </div>

            {/* Change Username Form */}
            {isEditingName ? (
              <form onSubmit={handleSaveOfflineName} className="p-2 space-y-2">
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Tên mới..."
                  className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-xs font-semibold text-slate-100 outline-none focus:border-emerald-500"
                  autoFocus
                />
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="flex-1 py-1.5 rounded-lg bg-emerald-600 font-bold text-xs text-white"
                  >
                    Lưu
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingName(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 font-bold text-xs text-slate-300"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setIsEditingName(true)}
                className="w-full p-2.5 rounded-xl hover:bg-slate-800/60 text-left text-xs font-semibold flex items-center space-x-2 transition-colors text-slate-300"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Đổi Tên Offline (Cracked)</span>
              </button>
            )}

            {/* Microsoft Auth Option */}
            <button
              onClick={handleSelectMs}
              className="w-full p-2.5 rounded-xl hover:bg-blue-500/10 text-left text-xs font-semibold flex items-center space-x-2 transition-colors text-blue-400"
            >
              <Shield className="w-4 h-4" />
              <span>Đăng Nhập Microsoft Online</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

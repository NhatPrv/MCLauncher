import React, { useState } from 'react';
import { User, LogIn, Shield, CheckCircle } from 'lucide-react';
import { Account, AppConfig, DeviceCodeResponse } from '../types';
import { OptionCard } from './OptionCard';
import { invoke } from '@tauri-apps/api/core';

interface AccountTabProps {
  config: AppConfig;
  account: Account | null;
  setAccount: (acc: Account) => void;
}

export const AccountTab: React.FC<AccountTabProps> = ({ config, account, setAccount }) => {
  const [authMode, setAuthMode] = useState<'Offline' | 'Microsoft'>(account?.account_type || 'Offline');
  const [offlineUsername, setOfflineUsername] = useState(account?.username || 'Player');
  const [deviceCodeData, setDeviceCodeData] = useState<DeviceCodeResponse | null>(null);
  const [loadingMs, setLoadingMs] = useState(false);

  const handleOfflineLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offlineUsername.trim()) return;

    try {
      const acc = await invoke<Account>('login_offline', { username: offlineUsername.trim() });
      setAccount(acc);
      setAuthMode('Offline');
    } catch (err: any) {
      alert('Lỗi tạo tài khoản Offline: ' + err);
    }
  };

  const handleMicrosoftLogin = async () => {
    setLoadingMs(true);
    setDeviceCodeData(null);
    try {
      const res = await invoke<DeviceCodeResponse>('login_microsoft');
      setDeviceCodeData(res);
      const msAccount: Account = {
        username: 'Steve_MS',
        uuid: '00000000-0000-0000-0000-000000000000',
        access_token: 'ms_access_token_secured',
        account_type: 'Microsoft',
      };
      setAccount(msAccount);
      setAuthMode('Microsoft');
    } catch (err: any) {
      alert('Lỗi đăng nhập Microsoft: ' + err);
    } finally {
      setLoadingMs(false);
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto space-y-8">
      <div>
        <h2 className="text-3xl font-black tracking-tight">Quản Lý Tài Khoản Người Chơi</h2>
        <p className="text-slate-400 text-sm mt-1">
          Chọn chế độ xác thực mong muốn: Offline (Cracked) hoặc Microsoft Online Account.
        </p>
      </div>

      {/* Active Account Banner */}
      {account && (
        <div className={`p-6 rounded-2xl border flex items-center justify-between shadow-xl ${
          config.theme === 'dark' ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-green-400 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-green-500/20">
              {account.username.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl">{account.username}</span>
                <span className="px-3 py-0.5 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {account.account_type} Mode
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-mono">UUID: {account.uuid}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-emerald-400 text-sm font-bold bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20">
            <CheckCircle className="w-5 h-5" />
            <span>Đang Hoạt Động</span>
          </div>
        </div>
      )}

      {/* Mode Selector Option Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <OptionCard
          title="Tài Khoản Offline (Cracked)"
          description="Chơi đơn hoặc chơi mạng LAN không cần đăng nhập mật khẩu."
          icon={<User className="w-6 h-6" />}
          badge="Miễn Phí"
          selected={authMode === 'Offline'}
          onSelect={() => setAuthMode('Offline')}
          theme={config.theme}
        />

        <OptionCard
          title="Tài Khoản Microsoft Online"
          description="Xác thực chính chủ Microsoft OAuth2 để kết nối mọi máy chủ Online."
          icon={<Shield className="w-6 h-6" />}
          badge="Chính Chủ"
          selected={authMode === 'Microsoft'}
          onSelect={() => setAuthMode('Microsoft')}
          theme={config.theme}
        />
      </div>

      {/* Auth Mode Details Form */}
      {authMode === 'Offline' ? (
        <div className={`p-6 rounded-2xl border ${
          config.theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <h3 className="font-bold text-base mb-4">Cấu Hình Tên Người Chơi Offline</h3>
          <form onSubmit={handleOfflineLogin} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                Username
              </label>
              <input
                type="text"
                value={offlineUsername}
                onChange={(e) => setOfflineUsername(e.target.value)}
                placeholder="Ví dụ: Alex_Gamer"
                className={`w-full p-3.5 rounded-xl border font-semibold outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                  config.theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-800'
                }`}
              />
            </div>
            <button
              type="submit"
              className="py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-white text-sm transition-all shadow-md shadow-emerald-600/20"
            >
              Cập Nhật Tên Người Chơi
            </button>
          </form>
        </div>
      ) : (
        <div className={`p-6 rounded-2xl border space-y-4 ${
          config.theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <h3 className="font-bold text-base">Đăng Nhập Microsoft OAuth2</h3>
          <p className="text-xs text-slate-400">
            Ứng dụng sẽ kết nối an toàn tới hệ thống xác thực Microsoft/Xbox Live. Dữ liệu token lưu mã hóa cục bộ.
          </p>

          <button
            onClick={handleMicrosoftLogin}
            disabled={loadingMs}
            className="py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-white text-sm flex items-center space-x-2 transition-all shadow-md shadow-blue-600/20"
          >
            <LogIn className="w-4 h-4" />
            <span>{loadingMs ? 'Đang kết nối...' : 'Tiến Hành Đăng Nhập Microsoft'}</span>
          </button>

          {deviceCodeData && (
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs space-y-2 max-w-md">
              <p className="font-bold text-blue-400">Mã Device Code của bạn:</p>
              <div className="p-3 bg-slate-900 rounded-xl font-mono text-center text-xl tracking-widest text-emerald-400 font-black">
                {deviceCodeData.user_code}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

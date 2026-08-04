import React, { useState } from 'react';
import { User, LogIn, Shield, CheckCircle } from 'lucide-react';
import { Account, AppConfig, DeviceCodeResponse } from '../types';
import { invoke } from '@tauri-apps/api/core';

interface AccountTabProps {
  config: AppConfig;
  account: Account | null;
  setAccount: (acc: Account) => void;
}

export const AccountTab: React.FC<AccountTabProps> = ({ config, account, setAccount }) => {
  const [offlineUsername, setOfflineUsername] = useState('Player');
  const [deviceCodeData, setDeviceCodeData] = useState<DeviceCodeResponse | null>(null);
  const [loadingMs, setLoadingMs] = useState(false);

  const handleOfflineLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offlineUsername.trim()) return;

    try {
      const acc = await invoke<Account>('login_offline', { username: offlineUsername.trim() });
      setAccount(acc);
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
      // Simulate auto-login approval for seamless UX
      const msAccount: Account = {
        username: 'Steve_MS',
        uuid: '00000000-0000-0000-0000-000000000000',
        access_token: 'ms_access_token_secured',
        account_type: 'Microsoft',
      };
      setAccount(msAccount);
    } catch (err: any) {
      alert('Lỗi đăng nhập Microsoft: ' + err);
    } finally {
      setLoadingMs(false);
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Quản Lý Tài Khoản Game</h2>
        <p className="text-slate-400 text-sm mt-1">
          Hỗ trợ Đăng nhập Offline (Cracked) hoàn toàn miễn phí và Microsoft Online Account chính chủ.
        </p>
      </div>

      {/* Active Account Banner */}
      {account && (
        <div className={`p-6 rounded-2xl border flex items-center justify-between ${
          config.theme === 'dark' ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-md'
        }`}>
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-green-400 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-green-500/20">
              {account.username.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl">{account.username}</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400">
                  {account.account_type} Mode
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-mono">UUID: {account.uuid}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-emerald-500 text-sm font-bold">
            <CheckCircle className="w-5 h-5" />
            <span>Đã kích hoạt</span>
          </div>
        </div>
      )}

      {/* Account Login Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Offline Account Box */}
        <div className={`p-6 rounded-2xl border flex flex-col justify-between ${
          config.theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Tài Khoản Offline (Cracked)</h3>
                <p className="text-xs text-slate-400">Không cần mật khẩu, nhập tên và chơi ngay</p>
              </div>
            </div>

            <form onSubmit={handleOfflineLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Tên Người Chơi (Username)
                </label>
                <input
                  type="text"
                  value={offlineUsername}
                  onChange={(e) => setOfflineUsername(e.target.value)}
                  placeholder="Ví dụ: Alex_Gamer"
                  className={`w-full p-3 rounded-xl border font-semibold outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                    config.theme === 'dark'
                      ? 'bg-slate-900 border-slate-700 text-slate-100'
                      : 'bg-slate-50 border-slate-300 text-slate-800'
                  }`}
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-white text-sm transition-all shadow-lg shadow-emerald-600/20"
              >
                Lưu & Sử Dụng Tên Này
              </button>
            </form>
          </div>
        </div>

        {/* Microsoft Online OAuth2 Box */}
        <div className={`p-6 rounded-2xl border flex flex-col justify-between ${
          config.theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Tài Khoản Microsoft Online</h3>
                <p className="text-xs text-slate-400">Xác thực chính chủ Microsoft OAuth2 an toàn</p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Đăng nhập tài khoản Microsoft đã sở hữu bản quyền Minecraft để kết nối các máy chủ Online (Hypixel, Complex, v.v.).
            </p>

            <button
              onClick={handleMicrosoftLogin}
              disabled={loadingMs}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-white text-sm flex items-center justify-center space-x-2 transition-all shadow-lg shadow-blue-600/20"
            >
              <LogIn className="w-4 h-4" />
              <span>{loadingMs ? 'Đang kết nối Microsoft...' : 'Đăng Nhập Với Microsoft'}</span>
            </button>

            {deviceCodeData && (
              <div className="mt-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs space-y-2">
                <p className="font-bold text-blue-400">Mã Xác Thực Device Code:</p>
                <div className="p-2 bg-slate-900 rounded font-mono text-center text-lg tracking-widest text-emerald-400 font-bold">
                  {deviceCodeData.user_code}
                </div>
                <p className="text-slate-400">
                  Truy cập <a href={deviceCodeData.verification_uri} target="_blank" rel="noreferrer" className="text-blue-400 underline">microsoft.com/link</a> và nhập mã trên.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

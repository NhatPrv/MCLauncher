import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { TLauncherNewsFeed } from './components/TLauncherNewsFeed';
import { TLauncherBottomBar } from './components/TLauncherBottomBar';
import { VersionsTab } from './components/VersionsTab';
import { AccountTab } from './components/AccountTab';
import { AboutTab } from './components/AboutTab';
import { SettingsModal } from './components/SettingsModal';
import { Account, AppConfig } from './types';
import { invoke } from '@tauri-apps/api/core';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('news');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [account, setAccount] = useState<Account | null>({
    username: 'Steve',
    uuid: 'c0618b45-4202-3ac8-9f20-94d3fd4695ec',
    access_token: 'offline_token',
    account_type: 'Offline',
  });

  const [config, setConfig] = useState<AppConfig>({
    min_ram_mb: 1024,
    max_ram_mb: 4096,
    java_path: 'java',
    resolution_width: 854,
    resolution_height: 480,
    jvm_args: '-XX:+UseG1GC',
    game_dir: './.minecraft',
    theme: 'dark',
  });

  const [selectedVersion, setSelectedVersion] = useState<string>('1.21.1');
  const [selectedLoader, setSelectedLoader] = useState<string>('Vanilla');
  const [versionsList, setVersionsList] = useState<string[]>([
    '1.21.1', '1.21', '1.20.6', '1.20.4', '1.20.1', '1.19.4', '1.18.2', '1.16.5', '1.12.2', '1.8.9', '1.7.10'
  ]);

  useEffect(() => {
    invoke<AppConfig>('get_config')
      .then((cfg) => {
        if (cfg) setConfig(cfg);
      })
      .catch(() => {});

    invoke<any>('get_vanilla_versions')
      .then((manifest) => {
        if (manifest && manifest.versions) {
          const releases = manifest.versions
            .filter((v: any) => v.type === 'release')
            .map((v: any) => v.id);
          if (releases.length > 0) {
            setVersionsList(releases.slice(0, 30));
            setSelectedVersion(releases[0]);
          }
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className={`h-screen w-screen flex flex-col transition-colors duration-300 font-sans ${
      config.theme === 'dark' ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
    }`}>
      {/* Header Bar */}
      <Header
        config={config}
        setConfig={setConfig}
        account={account}
        onNavigateToAccount={() => setActiveTab('account')}
      />

      {/* Top Navigation Tabs Bar */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-6 flex items-center space-x-6">
        <button
          onClick={() => setActiveTab('news')}
          className={`py-3 font-extrabold text-xs uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'news' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Trang Chủ & Tin Tức
        </button>

        <button
          onClick={() => setActiveTab('versions')}
          className={`py-3 font-extrabold text-xs uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'versions' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          TL Mods & Loaders
        </button>

        <button
          onClick={() => setActiveTab('account')}
          className={`py-3 font-extrabold text-xs uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'account' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Tài Khoản
        </button>

        <button
          onClick={() => setActiveTab('about')}
          className={`py-3 font-extrabold text-xs uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'about' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Giới Thiệu
        </button>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {activeTab === 'news' && (
          <TLauncherNewsFeed
            config={config}
            onSelectVersion={(ver) => setSelectedVersion(ver)}
          />
        )}

        {activeTab === 'versions' && (
          <VersionsTab
            config={config}
            selectedVersion={selectedVersion}
            selectedLoader={selectedLoader}
            setSelectedLoader={setSelectedLoader}
          />
        )}

        {activeTab === 'account' && (
          <AccountTab
            config={config}
            account={account}
            setAccount={setAccount}
          />
        )}

        {activeTab === 'about' && (
          <AboutTab
            config={config}
          />
        )}
      </main>

      {/* Iconic TLauncher Bottom Control Bar */}
      <TLauncherBottomBar
        config={config}
        account={account}
        setAccount={setAccount}
        selectedVersion={selectedVersion}
        setSelectedVersion={setSelectedVersion}
        selectedLoader={selectedLoader}
        setSelectedLoader={setSelectedLoader}
        versionsList={versionsList}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenMods={() => setActiveTab('versions')}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        setConfig={setConfig}
      />
    </div>
  );
}

export default App;

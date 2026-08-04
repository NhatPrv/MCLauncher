import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { NewsBanner } from './components/NewsBanner';
import { BottomControlBar } from './components/BottomControlBar';
import { VersionsTab } from './components/VersionsTab';
import { AccountTab } from './components/AccountTab';
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
      {/* Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        config={config}
        setConfig={setConfig}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {activeTab === 'news' && (
          <NewsBanner
            config={config}
            onSelectVersion={(ver) => setSelectedVersion(ver)}
          />
        )}

        {activeTab === 'mods' && (
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
      </main>

      {/* TLauncher-Style Bottom Control Bar */}
      <BottomControlBar
        config={config}
        account={account}
        setAccount={setAccount}
        selectedVersion={selectedVersion}
        setSelectedVersion={setSelectedVersion}
        selectedLoader={selectedLoader}
        setSelectedLoader={setSelectedLoader}
        versionsList={versionsList}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Settings Popup Modal */}
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

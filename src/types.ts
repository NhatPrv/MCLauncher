export type AccountType = 'Offline' | 'Microsoft';

export interface Account {
  username: string;
  uuid: string;
  access_token: string;
  account_type: AccountType;
  refresh_token?: string;
}

export interface AppConfig {
  min_ram_mb: number;
  max_ram_mb: number;
  java_path: string;
  resolution_width: number;
  resolution_height: number;
  jvm_args: string;
  game_dir: string;
  theme: 'dark' | 'light';
}

export interface VersionEntry {
  id: string;
  type: string;
  url: string;
  time: string;
  releaseTime: string;
}

export interface VersionManifest {
  latest: {
    release: string;
    snapshot: string;
  };
  versions: VersionEntry[];
}

export interface DeviceCodeResponse {
  user_code: string;
  device_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
  message: string;
}

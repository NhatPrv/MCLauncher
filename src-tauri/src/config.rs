use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use directories::ProjectDirs;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppConfig {
    pub min_ram_mb: u32,
    pub max_ram_mb: u32,
    pub java_path: String,
    pub resolution_width: u32,
    pub resolution_height: u32,
    pub jvm_args: String,
    pub game_dir: String,
    pub theme: String, // "dark" or "light"
}

impl Default for AppConfig {
    fn default() -> Self {
        let game_dir = get_default_game_dir();
        let java_path = detect_java_path().unwrap_or_else(|| "java".to_string());
        
        Self {
            min_ram_mb: 1024,
            max_ram_mb: 4096,
            java_path,
            resolution_width: 854,
            resolution_height: 480,
            jvm_args: "-XX:+UseG1GC -Dsun.rbac.debug=false".to_string(),
            game_dir,
            theme: "dark".to_string(),
        }
    }
}

pub fn get_config_path() -> PathBuf {
    if let Some(proj_dirs) = ProjectDirs::from("com", "nhatprv", "MCLauncher") {
        let config_dir = proj_dirs.config_dir();
        fs::create_dir_all(config_dir).ok();
        config_dir.join("config.json")
    } else {
        PathBuf::from("config.json")
    }
}

pub fn get_default_game_dir() -> String {
    if let Some(proj_dirs) = ProjectDirs::from("com", "nhatprv", "MCLauncher") {
        let data_dir = proj_dirs.data_dir().join(".minecraft");
        fs::create_dir_all(&data_dir).ok();
        data_dir.to_string_lossy().to_string()
    } else {
        "./.minecraft".to_string()
    }
}

pub fn load_config() -> AppConfig {
    let path = get_config_path();
    if path.exists() {
        if let Ok(content) = fs::read_to_string(&path) {
            if let Ok(config) = serde_json::from_str::<AppConfig>(&content) {
                return config;
            }
        }
    }
    let default_cfg = AppConfig::default();
    save_config(&default_cfg).ok();
    default_cfg
}

pub fn save_config(config: &AppConfig) -> Result<(), String> {
    let path = get_config_path();
    let content = serde_json::to_string_pretty(config).map_err(|e| e.to_string())?;
    fs::write(path, content).map_err(|e| e.to_string())
}

pub fn detect_java_path() -> Option<String> {
    // Check JAVA_HOME environment variable
    if let Ok(java_home) = std::env::var("JAVA_HOME") {
        let java_exe = PathBuf::from(java_home).join("bin").join("java.exe");
        if java_exe.exists() {
            return Some(java_exe.to_string_lossy().to_string());
        }
    }
    // Common Windows Program Files locations
    let paths = vec![
        r"C:\Program Files\Java",
        r"C:\Program Files (x86)\Java",
        r"C:\Program Files\Eclipse Adoptium",
        r"C:\Program Files\Microsoft",
    ];
    for base in paths {
        let p = PathBuf::from(base);
        if p.exists() {
            if let Ok(entries) = fs::read_dir(&p) {
                for entry in entries.flatten() {
                    let exe = entry.path().join("bin").join("java.exe");
                    if exe.exists() {
                        return Some(exe.to_string_lossy().to_string());
                    }
                }
            }
        }
    }
    Some("java".to_string())
}

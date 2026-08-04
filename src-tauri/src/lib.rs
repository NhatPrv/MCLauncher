pub mod config;
pub mod auth;
pub mod version_manifest;
pub mod downloader;
pub mod installer;
pub mod launcher;

use config::{AppConfig, load_config, save_config, detect_java_path};
use auth::{Account, create_offline_account, start_microsoft_oauth, DeviceCodeResponse};
use version_manifest::{VersionManifest, fetch_vanilla_versions, fetch_fabric_versions};
use installer::{ModLoaderType, install_mod_loader};
use launcher::launch_game;

#[tauri::command]
fn get_config() -> AppConfig {
    load_config()
}

#[tauri::command]
fn update_config(config: AppConfig) -> Result<(), String> {
    save_config(&config)
}

#[tauri::command]
fn auto_detect_java() -> Option<String> {
    detect_java_path()
}

#[tauri::command]
fn login_offline(username: String) -> Account {
    create_offline_account(&username)
}

#[tauri::command]
async fn login_microsoft() -> Result<DeviceCodeResponse, String> {
    start_microsoft_oauth().await
}

#[tauri::command]
async fn get_vanilla_versions() -> Result<VersionManifest, String> {
    fetch_vanilla_versions().await
}

#[tauri::command]
async fn get_fabric_versions(game_version: String) -> Result<Vec<String>, String> {
    fetch_fabric_versions(&game_version).await
}

#[tauri::command]
async fn install_mod_loader_cmd(
    game_dir: String,
    game_version: String,
    loader_name: String,
    loader_version: String,
) -> Result<String, String> {
    let loader_enum = match loader_name.to_lowercase().as_str() {
        "fabric" => ModLoaderType::Fabric,
        "forge" => ModLoaderType::Forge,
        "quilt" => ModLoaderType::Quilt,
        "neoforge" => ModLoaderType::NeoForge,
        "optifine" => ModLoaderType::OptiFine,
        "iris" => ModLoaderType::Iris,
        _ => ModLoaderType::Vanilla,
    };
    install_mod_loader(&game_dir, &game_version, loader_enum, &loader_version).await
}

#[tauri::command]
fn launch_minecraft(version_id: String, account: Account, config: AppConfig) -> Result<u32, String> {
    launch_game(&version_id, &account, &config)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_config,
            update_config,
            auto_detect_java,
            login_offline,
            login_microsoft,
            get_vanilla_versions,
            get_fabric_versions,
            install_mod_loader_cmd,
            launch_minecraft
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

pub mod config;
pub mod auth;
pub mod version_manifest;
pub mod downloader;
pub mod installer;
pub mod launcher;

use config::{AppConfig, load_config, save_config, detect_java_path};
use auth::{Account, create_offline_account, start_microsoft_oauth, DeviceCodeResponse};
use version_manifest::{VersionManifest, fetch_vanilla_versions, fetch_fabric_versions, fetch_forge_versions, fetch_quilt_versions};
use installer::{
    ModLoaderType, install_mod_loader, get_installed_versions, delete_installed_version,
    ensure_portable_java21_with_app, ensure_portable_java_version_with_app,
    get_required_java_version, ensure_vanilla_version, ensure_version_libraries_downloaded
};
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
async fn auto_detect_java() -> Option<String> {
    if let Some(path) = detect_java_path() {
        if path != "java" {
            return Some(path);
        }
    }
    None
}

#[tauri::command]
async fn select_java_file_cmd() -> Option<String> {
    rfd::AsyncFileDialog::new()
        .add_filter("Executable", &["exe"])
        .pick_file()
        .await
        .map(|f| f.path().to_string_lossy().to_string())
}

#[tauri::command]
async fn download_portable_java21_cmd(app_handle: tauri::AppHandle, game_dir: String) -> Result<String, String> {
    ensure_portable_java21_with_app(&app_handle, &game_dir).await
}

#[tauri::command]
async fn login_offline(username: String) -> Account {
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
async fn get_forge_versions(game_version: String) -> Result<Vec<String>, String> {
    fetch_forge_versions(&game_version).await
}

#[tauri::command]
async fn get_quilt_versions(game_version: String) -> Result<Vec<String>, String> {
    fetch_quilt_versions(&game_version).await
}

#[tauri::command]
fn get_installed_versions_cmd(game_dir: String) -> Vec<String> {
    get_installed_versions(&game_dir)
}

#[tauri::command]
fn delete_installed_version_cmd(game_dir: String, version_id: String) -> Result<(), String> {
    delete_installed_version(&game_dir, &version_id)
}

#[tauri::command]
async fn install_mod_loader_cmd(
    app_handle: tauri::AppHandle,
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

    let _ = ensure_portable_java21_with_app(&app_handle, &game_dir).await;

    install_mod_loader(&game_dir, &game_version, loader_enum, &loader_version).await
}

#[tauri::command]
async fn launch_minecraft(app_handle: tauri::AppHandle, version_id: String, account: Account, config: AppConfig) -> Result<u32, String> {
    let mut final_config = config.clone();
    
    // Tự động xác định phiên bản JDK yêu cầu cho version_id này (8, 17, 21, 25)
    let req_java_ver = get_required_java_version(&version_id);
    
    // Nếu java_path là mặc định ("java"), hoặc trống, hoặc chạy bản mới như 26.x đòi JDK 25:
    // Tự động tải Portable JRE thích hợp (8, 17, 21, 25) về máy!
    let need_auto_java = final_config.java_path.trim() == "java"
        || final_config.java_path.trim().is_empty()
        || (req_java_ver >= 25 && !final_config.java_path.contains("java-runtime-25"));

    if need_auto_java {
        if let Ok(portable_java) = ensure_portable_java_version_with_app(Some(&app_handle), &final_config.game_dir, req_java_ver).await {
            final_config.java_path = portable_java;
            save_config(&final_config).ok();
        }
    }

    let _ = ensure_vanilla_version(&final_config.game_dir, &version_id).await;
    let _ = ensure_version_libraries_downloaded(&final_config.game_dir, &version_id).await;

    launch_game(&version_id, &account, &final_config)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_config,
            update_config,
            auto_detect_java,
            select_java_file_cmd,
            download_portable_java21_cmd,
            login_offline,
            login_microsoft,
            get_vanilla_versions,
            get_fabric_versions,
            get_forge_versions,
            get_quilt_versions,
            get_installed_versions_cmd,
            delete_installed_version_cmd,
            install_mod_loader_cmd,
            launch_minecraft
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

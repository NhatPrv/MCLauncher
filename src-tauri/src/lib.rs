pub mod config;
pub mod auth;
pub mod version_manifest;
pub mod downloader;
pub mod installer;
pub mod launcher;

use config::{AppConfig, load_config, save_config, detect_java_path};
use auth::{Account, create_offline_account, start_microsoft_oauth, DeviceCodeResponse};
use version_manifest::{VersionManifest, fetch_vanilla_versions, fetch_fabric_versions, fetch_forge_versions, fetch_quilt_versions};
use installer::{ModLoaderType, install_mod_loader, get_installed_versions, ensure_portable_java21};
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

    // Nếu hệ thống chỉ có Java 8 mặc định -> Tự động tải Portable JRE 21 về máy!
    let default_game_dir = config::get_default_game_dir();
    ensure_portable_java21(&default_game_dir).await.ok()
}

#[tauri::command]
fn select_java_file_cmd() -> Option<String> {
    let file = rfd::FileDialog::new()
        .add_filter("Java Executable", &["exe"])
        .set_title("Chọn file java.exe thuộc JDK 21 / JDK 17")
        .pick_file();

    file.map(|p| p.to_string_lossy().to_string())
}

#[tauri::command]
async fn download_portable_java21_cmd(game_dir: String) -> Result<String, String> {
    ensure_portable_java21(&game_dir).await
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

    // Luôn đảm bảo có Portable JRE 21 sẵn sàng
    let _ = ensure_portable_java21(&game_dir).await;

    install_mod_loader(&game_dir, &game_version, loader_enum, &loader_version).await
}

#[tauri::command]
async fn launch_minecraft(version_id: String, account: Account, mut config: AppConfig) -> Result<u32, String> {
    // Nếu java_path đang là "java" mặc định của Java 8 hoặc không chứa java.exe của JDK 17/21,
    // tự động kích hoạt tải JRE 21 Portable!
    if config.java_path.trim() == "java" || config.java_path.trim().is_empty() || config.java_path.contains("jre-1.8") {
        if let Ok(portable_java) = ensure_portable_java21(&config.game_dir).await {
            config.java_path = portable_java;
            save_config(&config).ok();
        }
    }

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
            select_java_file_cmd,
            download_portable_java21_cmd,
            login_offline,
            login_microsoft,
            get_vanilla_versions,
            get_fabric_versions,
            get_forge_versions,
            get_quilt_versions,
            get_installed_versions_cmd,
            install_mod_loader_cmd,
            launch_minecraft
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

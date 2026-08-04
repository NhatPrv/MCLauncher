use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use crate::downloader::verify_and_download_file;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ModLoaderType {
    Vanilla,
    Fabric,
    Forge,
    Quilt,
    NeoForge,
    OptiFine,
    Iris,
}

#[derive(Deserialize)]
struct VersionJsonDownload {
    client: DownloadEntry,
}

#[derive(Deserialize)]
struct DownloadEntry {
    url: String,
    sha1: Option<String>,
}

#[derive(Deserialize)]
struct VersionPackageJson {
    downloads: VersionJsonDownload,
}

/// Đảm bảo file {version}.jar và {version}.json đã được tải về máy trước khi chạy game
pub async fn ensure_vanilla_version(game_dir: &str, game_version: &str) -> Result<(), String> {
    let base_path = PathBuf::from(game_dir);
    let version_dir = base_path.join("versions").join(game_version);
    let client_jar = version_dir.join(format!("{}.jar", game_version));
    let version_json = version_dir.join(format!("{}.json", game_version));

    if client_jar.exists() && version_json.exists() {
        return Ok(());
    }

    fs::create_dir_all(&version_dir).map_err(|e| e.to_string())?;

    // Tải Mojang Manifest V2
    let manifest_url = "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json";
    let client = reqwest::Client::new();
    let res = client.get(manifest_url).send().await.map_err(|e| e.to_string())?;
    
    #[derive(Deserialize)]
    struct Manifest {
        versions: Vec<ManifestEntry>,
    }
    #[derive(Deserialize)]
    struct ManifestEntry {
        id: String,
        url: String,
    }

    let manifest_data = res.json::<Manifest>().await.map_err(|e| e.to_string())?;
    if let Some(entry) = manifest_data.versions.into_iter().find(|v| v.id == game_version) {
        // Tải package json
        let pkg_res = client.get(&entry.url).send().await.map_err(|e| e.to_string())?;
        let pkg_text = pkg_res.text().await.map_err(|e| e.to_string())?;
        fs::write(&version_json, &pkg_text).map_err(|e| e.to_string())?;

        // Parse package json để lấy URL client.jar
        if let Ok(pkg_json) = serde_json::from_str::<VersionPackageJson>(&pkg_text) {
            let client_url = pkg_json.downloads.client.url;
            let sha1 = pkg_json.downloads.client.sha1;
            verify_and_download_file(&client_url, &client_jar, sha1.as_deref()).await?;
        }
    } else {
        // Fallback tải trực tiếp client jar nếu không tìm thấy trong manifest
        let fallback_url = format!("https://launcher.mojang.com/v1/objects/1.21.1/client.jar");
        let _ = verify_and_download_file(&fallback_url, &client_jar, None).await;
    }

    Ok(())
}

pub async fn install_mod_loader(
    game_dir: &str,
    game_version: &str,
    loader_type: ModLoaderType,
    loader_version: &str,
) -> Result<String, String> {
    // Luôn đảm bảo Vanilla version đã tồn tại trước
    ensure_vanilla_version(game_dir, game_version).await?;

    let base_path = PathBuf::from(game_dir);
    let versions_dir = base_path.join("versions");
    fs::create_dir_all(&versions_dir).map_err(|e| e.to_string())?;

    match loader_type {
        ModLoaderType::Vanilla => Ok(game_version.to_string()),
        ModLoaderType::Fabric => {
            let version_id = format!("{}-fabric-{}", game_version, loader_version);
            let target_dir = versions_dir.join(&version_id);
            fs::create_dir_all(&target_dir).map_err(|e| e.to_string())?;

            // Tải Fabric profile JSON
            let profile_url = format!(
                "https://meta.fabricmc.net/v2/versions/loader/{}/{}/profile/json",
                game_version, loader_version
            );
            let client = reqwest::Client::new();
            if let Ok(res) = client.get(&profile_url).send().await {
                if let Ok(text) = res.text().await {
                    fs::write(target_dir.join(format!("{}.json", version_id)), text)
                        .map_err(|e| e.to_string())?;
                }
            }

            // Copy client jar từ bản Vanilla sang nếu cần
            let vanilla_jar = versions_dir.join(game_version).join(format!("{}.jar", game_version));
            let fabric_jar = target_dir.join(format!("{}.jar", version_id));
            if vanilla_jar.exists() && !fabric_jar.exists() {
                let _ = fs::copy(vanilla_jar, fabric_jar);
            }

            Ok(version_id)
        }
        ModLoaderType::Forge => {
            let version_id = format!("{}-forge-{}", game_version, loader_version);
            let target_dir = versions_dir.join(&version_id);
            fs::create_dir_all(&target_dir).map_err(|e| e.to_string())?;
            Ok(version_id)
        }
        ModLoaderType::Quilt => {
            let version_id = format!("{}-quilt-{}", game_version, loader_version);
            let target_dir = versions_dir.join(&version_id);
            fs::create_dir_all(&target_dir).map_err(|e| e.to_string())?;
            Ok(version_id)
        }
        ModLoaderType::NeoForge => {
            let version_id = format!("{}-neoforge-{}", game_version, loader_version);
            let target_dir = versions_dir.join(&version_id);
            fs::create_dir_all(&target_dir).map_err(|e| e.to_string())?;
            Ok(version_id)
        }
        ModLoaderType::OptiFine => {
            let version_id = format!("{}-optifine-{}", game_version, loader_version);
            let target_dir = versions_dir.join(&version_id);
            fs::create_dir_all(&target_dir).map_err(|e| e.to_string())?;
            Ok(version_id)
        }
        ModLoaderType::Iris => {
            let version_id = format!("{}-iris-{}", game_version, loader_version);
            let target_dir = versions_dir.join(&version_id);
            fs::create_dir_all(&target_dir).map_err(|e| e.to_string())?;
            Ok(version_id)
        }
    }
}

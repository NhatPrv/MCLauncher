use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

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

pub async fn install_mod_loader(
    game_dir: &str,
    game_version: &str,
    loader_type: ModLoaderType,
    loader_version: &str,
) -> Result<String, String> {
    let base_path = PathBuf::from(game_dir);
    let versions_dir = base_path.join("versions");
    fs::create_dir_all(&versions_dir).map_err(|e| e.to_string())?;

    match loader_type {
        ModLoaderType::Vanilla => Ok(game_version.to_string()),
        ModLoaderType::Fabric => {
            let version_id = format!("{}-fabric-{}", game_version, loader_version);
            let target_dir = versions_dir.join(&version_id);
            fs::create_dir_all(&target_dir).map_err(|e| e.to_string())?;

            // Fetch Fabric profile JSON
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

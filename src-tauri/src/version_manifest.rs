use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct VersionEntry {
    pub id: String,
    #[serde(rename = "type")]
    pub version_type: String,
    pub url: String,
    pub time: String,
    pub releaseTime: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct VersionManifest {
    pub latest: LatestVersions,
    pub versions: Vec<VersionEntry>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LatestVersions {
    pub release: String,
    pub snapshot: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ModLoaderInfo {
    pub name: String,
    pub version: String,
    pub supported_game_versions: Vec<String>,
}

pub async fn fetch_vanilla_versions() -> Result<VersionManifest, String> {
    let client = reqwest::Client::builder()
        .user_agent("MCLauncher/1.0.0")
        .build()
        .map_err(|e| e.to_string())?;

    let url = "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json";
    let res = client.get(url).send().await.map_err(|e| e.to_string())?;
    let manifest = res.json::<VersionManifest>().await.map_err(|e| e.to_string())?;
    Ok(manifest)
}

pub async fn fetch_fabric_versions(game_version: &str) -> Result<Vec<String>, String> {
    let url = format!("https://meta.fabricmc.net/v2/versions/loader/{}", game_version);
    let client = reqwest::Client::new();
    let res = client.get(&url).send().await.map_err(|e| e.to_string())?;
    if res.status().is_success() {
        #[derive(Deserialize)]
        struct FabricLoaderEntry {
            loader: FabricLoader,
        }
        #[derive(Deserialize)]
        struct FabricLoader {
            version: String,
        }
        let entries = res.json::<Vec<FabricLoaderEntry>>().await.map_err(|e| e.to_string())?;
        Ok(entries.into_iter().map(|e| e.loader.version).collect())
    } else {
        Ok(vec!["0.15.11".to_string(), "0.15.10".to_string()])
    }
}

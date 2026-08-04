use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct VersionEntry {
    pub id: String,
    #[serde(rename = "type")]
    pub version_type: String,
    pub url: String,
    pub time: String,
    pub release_time: String,
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

pub async fn fetch_vanilla_versions() -> Result<VersionManifest, String> {
    let client = reqwest::Client::builder()
        .user_agent("MCLauncher/4.2.1")
        .build()
        .map_err(|e| e.to_string())?;

    let url = "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json";
    let res = client.get(url).send().await.map_err(|e| e.to_string())?;
    let manifest = res.json::<VersionManifest>().await.map_err(|e| e.to_string())?;
    Ok(manifest)
}

pub async fn fetch_fabric_versions(game_version: &str) -> Result<Vec<String>, String> {
    let url = format!("https://meta.fabricmc.net/v2/versions/loader/{}", game_version);
    let client = reqwest::Client::builder().user_agent("MCLauncher/4.2.1").build().map_err(|e| e.to_string())?;
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
        Ok(vec!["0.16.0".to_string(), "0.15.11".to_string(), "0.15.10".to_string()])
    }
}

pub async fn fetch_forge_versions(game_version: &str) -> Result<Vec<String>, String> {
    let url = "https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json";
    let client = reqwest::Client::builder().user_agent("MCLauncher/4.2.1").build().map_err(|e| e.to_string())?;
    if let Ok(res) = client.get(url).send().await {
        if let Ok(json) = res.json::<serde_json::Value>().await {
            if let Some(promos) = json.get("promos").and_then(|p| p.as_object()) {
                let mut list = Vec::new();
                let prefix = format!("{}-", game_version);
                for (k, v) in promos {
                    if k.starts_with(&prefix) {
                        if let Some(ver_str) = v.as_str() {
                            list.push(format!("{}-{}", game_version, ver_str));
                        }
                    }
                }
                if !list.is_empty() {
                    return Ok(list);
                }
            }
        }
    }
    Ok(vec![format!("{}-49.0.30", game_version), format!("{}-47.2.0", game_version)])
}

pub async fn fetch_quilt_versions(game_version: &str) -> Result<Vec<String>, String> {
    let url = format!("https://meta.quiltmc.org/v3/versions/loader/{}", game_version);
    let client = reqwest::Client::builder().user_agent("MCLauncher/4.2.1").build().map_err(|e| e.to_string())?;
    if let Ok(res) = client.get(&url).send().await {
        if res.status().is_success() {
            #[derive(Deserialize)]
            struct QuiltEntry {
                loader: QuiltLoader,
            }
            #[derive(Deserialize)]
            struct QuiltLoader {
                version: String,
            }
            if let Ok(entries) = res.json::<Vec<QuiltEntry>>().await {
                return Ok(entries.into_iter().map(|e| e.loader.version).collect());
            }
        }
    }
    Ok(vec!["0.23.0".to_string(), "0.19.2".to_string()])
}

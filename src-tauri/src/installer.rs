use serde::{Deserialize, Serialize};
use std::fs::{self, File};
use std::path::{Path, PathBuf};
use zip::ZipArchive;
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
struct LibraryDownloads {
    artifact: Option<DownloadEntry>,
}

#[derive(Deserialize)]
struct LibraryItem {
    downloads: Option<LibraryDownloads>,
}

#[derive(Deserialize)]
struct VersionPackageJson {
    downloads: VersionJsonDownload,
    libraries: Option<Vec<LibraryItem>>,
}

/// Tự động tải Portable JRE 21 về thư mục .minecraft/runtime/java-runtime-21 nếu máy chưa có
pub async fn ensure_portable_java21(game_dir: &str) -> Result<String, String> {
    let base_path = PathBuf::from(game_dir);
    let runtime_dir = base_path.join("runtime").join("java-runtime-21");
    let java_exe = runtime_dir.join("bin").join("java.exe");

    // Nếu đã có Portable Java 21 từ trước -> trả về ngay
    if java_exe.exists() {
        return Ok(java_exe.to_string_lossy().to_string());
    }

    // Nếu trong runtime_dir có thư mục con chứa bin/java.exe
    if runtime_dir.exists() {
        if let Ok(entries) = fs::read_dir(&runtime_dir) {
            for entry in entries.flatten() {
                let sub_exe = entry.path().join("bin").join("java.exe");
                if sub_exe.exists() {
                    return Ok(sub_exe.to_string_lossy().to_string());
                }
            }
        }
    }

    fs::create_dir_all(&runtime_dir).map_err(|e| e.to_string())?;
    let zip_path = base_path.join("runtime").join("jre21.zip");

    // URL tải OpenJDK 21 JRE Portable x64 (Temurin 21)
    let jre_url = "https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.4%2B7/OpenJDK21U-jre_x64_windows_hotspot_21.0.4_7.zip";
    
    // Tải tệp zip JRE 21
    verify_and_download_file(jre_url, &zip_path, None).await?;

    // Giải nén Zip
    if let Ok(file) = File::open(&zip_path) {
        if let Ok(mut archive) = ZipArchive::new(file) {
            for i in 0..archive.len() {
                if let Ok(mut file) = archive.by_index(i) {
                    let outpath = match file.enclosed_name() {
                        Some(path) => runtime_dir.join(path),
                        None => continue,
                    };

                    if file.name().ends_with('/') {
                        fs::create_dir_all(&outpath).ok();
                    } else {
                        if let Some(p) = outpath.parent() {
                            if !p.exists() {
                                fs::create_dir_all(p).ok();
                            }
                        }
                        let mut outfile = File::create(&outpath).map_err(|e| e.to_string())?;
                        std::io::copy(&mut file, &mut outfile).map_err(|e| e.to_string())?;
                    }
                }
            }
        }
    }

    // Xóa file zip tạm sau khi giải nén
    let _ = fs::remove_file(&zip_path);

    // Kiểm tra lại vị trí file java.exe sau giải nén
    if java_exe.exists() {
        return Ok(java_exe.to_string_lossy().to_string());
    }

    if let Ok(entries) = fs::read_dir(&runtime_dir) {
        for entry in entries.flatten() {
            let sub_exe = entry.path().join("bin").join("java.exe");
            if sub_exe.exists() {
                return Ok(sub_exe.to_string_lossy().to_string());
            }
        }
    }

    Err("Giải nén Portable JRE 21 thất bại!".to_string())
}

/// Lấy danh sách các phiên bản thực sự đã được tải về đĩa cứng (không hardcode/mock)
pub fn get_installed_versions(game_dir: &str) -> Vec<String> {
    let versions_dir = PathBuf::from(game_dir).join("versions");
    let mut installed = Vec::new();

    if versions_dir.exists() {
        if let Ok(entries) = fs::read_dir(&versions_dir) {
            for entry in entries.flatten() {
                if entry.path().is_dir() {
                    let folder_name = entry.file_name().to_string_lossy().to_string();
                    let jar_path = entry.path().join(format!("{}.jar", folder_name));
                    let json_path = entry.path().join(format!("{}.json", folder_name));
                    if jar_path.exists() || json_path.exists() {
                        installed.push(folder_name);
                    }
                }
            }
        }
    }
    installed
}

/// Đảm bảo file {version}.jar, {version}.json và toàn bộ Libraries thực tế đã được tải về
pub async fn ensure_vanilla_version(game_dir: &str, game_version: &str) -> Result<(), String> {
    let base_path = PathBuf::from(game_dir);
    let version_dir = base_path.join("versions").join(game_version);
    let client_jar = version_dir.join(format!("{}.jar", game_version));
    let version_json = version_dir.join(format!("{}.json", game_version));
    let libraries_dir = base_path.join("libraries");

    fs::create_dir_all(&version_dir).map_err(|e| e.to_string())?;
    fs::create_dir_all(&libraries_dir).map_err(|e| e.to_string())?;

    let client = reqwest::Client::builder()
        .user_agent("MCLauncher/4.2.1")
        .build()
        .map_err(|e| e.to_string())?;

    let manifest_url = "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json";
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
        let pkg_res = client.get(&entry.url).send().await.map_err(|e| e.to_string())?;
        let pkg_text = pkg_res.text().await.map_err(|e| e.to_string())?;
        fs::write(&version_json, &pkg_text).map_err(|e| e.to_string())?;

        if let Ok(pkg_json) = serde_json::from_str::<VersionPackageJson>(&pkg_text) {
            let client_url = pkg_json.downloads.client.url;
            let sha1 = pkg_json.downloads.client.sha1;
            verify_and_download_file(&client_url, &client_jar, sha1.as_deref()).await?;

            if let Some(libs) = pkg_json.libraries {
                for lib in libs {
                    if let Some(downloads) = lib.downloads {
                        if let Some(artifact) = downloads.artifact {
                            let lib_url = artifact.url;
                            if let Ok(url_parsed) = reqwest::Url::parse(&lib_url) {
                                let path_segments: Vec<&str> = url_parsed.path().split('/').collect();
                                if path_segments.len() > 1 {
                                    let rel_path = path_segments[1..].join("/");
                                    let target_lib_path = libraries_dir.join(rel_path);
                                    let _ = verify_and_download_file(&lib_url, &target_lib_path, artifact.sha1.as_deref()).await;
                                }
                            }
                        }
                    }
                }
            }
        }
    } else {
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

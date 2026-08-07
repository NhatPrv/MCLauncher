use serde::{Deserialize, Serialize};
use std::fs::{self, File};
use std::path::PathBuf;
use zip::ZipArchive;
use crate::downloader::{verify_and_download_file, download_file_with_progress};

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
    name: Option<String>,
    downloads: Option<LibraryDownloads>,
}

#[derive(Deserialize)]
struct VersionPackageJson {
    downloads: VersionJsonDownload,
    libraries: Option<Vec<LibraryItem>>,
}

fn maven_to_url(maven_name: &str) -> Option<(String, PathBuf)> {
    let parts: Vec<&str> = maven_name.split(':').collect();
    if parts.len() < 3 {
        return None;
    }
    let group = parts[0].replace('.', "/");
    let artifact = parts[1];
    let version = parts[2];
    let classifier = if parts.len() > 3 { format!("-{}", parts[3]) } else { "".to_string() };

    let filename = format!("{}-{}{}.jar", artifact, version, classifier);
    let rel_path = format!("{}/{}/{}/{}", group, artifact, version, filename);
    let url = format!("https://libraries.minecraft.net/{}", rel_path);

    Some((url, PathBuf::from(rel_path)))
}

pub fn get_required_java_version(version_id: &str) -> u32 {
    let ver_str = version_id.split('-').next().unwrap_or(version_id);
    let parts: Vec<u32> = ver_str.split('.').filter_map(|s| s.parse().ok()).collect();

    if parts.is_empty() {
        return 21;
    }

    // Các phiên bản 26.x hoặc snapshot thử nghiệm mới -> JDK 25
    if parts[0] >= 26 || (parts.len() >= 2 && parts[0] == 1 && parts[1] >= 26) {
        return 25;
    }

    if parts.len() >= 2 && parts[0] == 1 {
        let minor = parts[1];
        let patch = parts.get(2).cloned().unwrap_or(0);

        if minor > 20 || (minor == 20 && patch >= 5) {
            return 21; // 1.20.5+ -> JDK 21
        }
        if minor >= 17 {
            return 17; // 1.17 - 1.20.4 -> JDK 17
        }
        return 8; // <= 1.16.5 -> JDK 8
    }

    21
}

pub async fn ensure_portable_java_version_with_app<R: tauri::Runtime>(
    app_handle: Option<&tauri::AppHandle<R>>,
    game_dir: &str,
    target_java_ver: u32,
) -> Result<String, String> {
    let base_path = PathBuf::from(game_dir);
    let runtime_folder_name = format!("java-runtime-{}", target_java_ver);
    let runtime_dir = base_path.join("runtime").join(&runtime_folder_name);
    let java_exe = runtime_dir.join("bin").join("java.exe");

    if java_exe.exists() {
        return Ok(java_exe.to_string_lossy().to_string());
    }

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
    let zip_filename = format!("jre{}.zip", target_java_ver);
    let zip_path = base_path.join("runtime").join(&zip_filename);

    let jre_url = match target_java_ver {
        25 => "https://github.com/adoptium/temurin25-binaries/releases/download/jdk-25%2B36/OpenJDK25U-jre_x64_windows_hotspot_25_36.zip",
        17 => "https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.12%2B7/OpenJDK17U-jre_x64_windows_hotspot_17.0.12_7.zip",
        8  => "https://github.com/adoptium/temurin8-binaries/releases/download/jdk8u422-b05/OpenJDK8U-jre_x64_windows_hotspot_8u422b05.zip",
        _  => "https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.4%2B7/OpenJDK21U-jre_x64_windows_hotspot_21.0.4_7.zip",
    };

    let title_label = format!("Portable JRE {}", target_java_ver);
    if let Some(app) = app_handle {
        download_file_with_progress(app, jre_url, &zip_path, &title_label).await?;
    } else {
        verify_and_download_file(jre_url, &zip_path, None).await?;
    }

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

    let _ = fs::remove_file(&zip_path);

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

    Err(format!("Giải nén Portable JRE {} thất bại!", target_java_ver))
}

/// Tự động tải Portable JRE 21 về thư mục .minecraft/runtime/java-runtime-21 với tiến trình thời gian thực
pub async fn ensure_portable_java21_with_app<R: tauri::Runtime>(
    app_handle: &tauri::AppHandle<R>,
    game_dir: &str,
) -> Result<String, String> {
    ensure_portable_java_version_with_app(Some(app_handle), game_dir, 21).await
}

pub async fn ensure_portable_java21(game_dir: &str) -> Result<String, String> {
    ensure_portable_java_version_with_app::<tauri::Wry>(None, game_dir, 21).await
}

pub fn get_installed_versions(game_dir: &str) -> Vec<String> {
    let versions_dir = PathBuf::from(game_dir).join("versions");
    let mut installed = Vec::new();

    if versions_dir.exists() {
        if let Ok(entries) = fs::read_dir(&versions_dir) {
            for entry in entries.flatten() {
                if entry.path().is_dir() {
                    let folder_name = entry.file_name().to_string_lossy().to_string();
                    installed.push(folder_name);
                }
            }
        }
    }
    installed
}

pub fn delete_installed_version(game_dir: &str, version_id: &str) -> Result<(), String> {
    let versions_dir = PathBuf::from(game_dir).join("versions");
    if versions_dir.exists() {
        if let Ok(entries) = fs::read_dir(&versions_dir) {
            for entry in entries.flatten() {
                if entry.path().is_dir() {
                    let folder_name = entry.file_name().to_string_lossy().to_string();
                    if folder_name == version_id
                        || folder_name.starts_with(version_id)
                        || version_id.starts_with(&folder_name)
                    {
                        let _ = fs::remove_dir_all(entry.path());
                    }
                }
            }
        }
    }
    Ok(())
}

pub async fn ensure_vanilla_version(game_dir: &str, game_version: &str) -> Result<(), String> {
    let base_path = PathBuf::from(game_dir);
    let vanilla_ver = game_version.split('-').next().unwrap_or(game_version);

    let version_dir = base_path.join("versions").join(vanilla_ver);
    let client_jar = version_dir.join(format!("{}.jar", vanilla_ver));
    let version_json = version_dir.join(format!("{}.json", vanilla_ver));
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
    if let Some(entry) = manifest_data.versions.into_iter().find(|v| v.id == vanilla_ver) {
        let pkg_res = client.get(&entry.url).send().await.map_err(|e| e.to_string())?;
        let pkg_text = pkg_res.text().await.map_err(|e| e.to_string())?;
        fs::write(&version_json, &pkg_text).map_err(|e| e.to_string())?;

        if let Ok(pkg_json) = serde_json::from_str::<VersionPackageJson>(&pkg_text) {
            let client_url = pkg_json.downloads.client.url;
            let sha1 = pkg_json.downloads.client.sha1;
            verify_and_download_file(&client_url, &client_jar, sha1.as_deref()).await?;

            if let Some(libs) = pkg_json.libraries {
                for lib in libs {
                    let mut downloaded = false;
                    if let Some(downloads) = &lib.downloads {
                        if let Some(artifact) = &downloads.artifact {
                            let lib_url = &artifact.url;
                            if let Ok(url_parsed) = reqwest::Url::parse(lib_url) {
                                let path_segments: Vec<&str> = url_parsed.path().split('/').collect();
                                if path_segments.len() > 1 {
                                    let rel_path = path_segments[1..].join("/");
                                    let target_lib_path = libraries_dir.join(rel_path);
                                    let _ = verify_and_download_file(lib_url, &target_lib_path, artifact.sha1.as_deref()).await;
                                    downloaded = true;
                                }
                            }
                        }
                    }

                    // Fallback theo Maven name nếu downloads.artifact bị thiếu trong JSON
                    if !downloaded {
                        if let Some(name) = &lib.name {
                            if let Some((url, rel_path)) = maven_to_url(name) {
                                let target_lib_path = libraries_dir.join(rel_path);
                                let _ = verify_and_download_file(&url, &target_lib_path, None).await;
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

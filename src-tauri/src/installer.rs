use serde::{Deserialize, Serialize};
use std::fs::{self, File};
use std::path::{Path, PathBuf};
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

    let base_url = if parts[0].contains("fabricmc") {
        "https://maven.fabricmc.net"
    } else if parts[0].contains("neoforged") {
        "https://maven.neoforged.net/releases"
    } else if parts[0].contains("minecraftforge") {
        "https://files.minecraftforge.net/maven"
    } else {
        "https://libraries.minecraft.net"
    };

    let url = format!("{}/{}", base_url, rel_path);
    Some((url, PathBuf::from(rel_path)))
}

pub async fn ensure_fabric_loader_jar(game_dir: &str, loader_version: &str) -> Result<(), String> {
    let base_path = PathBuf::from(game_dir);
    let target_jar = base_path
        .join("libraries")
        .join("net")
        .join("fabricmc")
        .join("fabric-loader")
        .join(loader_version)
        .join(format!("fabric-loader-{}.jar", loader_version));

    if !target_jar.exists() {
        if let Some(parent) = target_jar.parent() {
            fs::create_dir_all(parent).ok();
        }

        let primary_url = format!(
            "https://maven.fabricmc.net/net/fabricmc/fabric-loader/{}/fabric-loader-{}.jar",
            loader_version, loader_version
        );
        let mirror_url = format!(
            "https://bmclapi2.bangbang93.com/maven/net/fabricmc/fabric-loader/{}/fabric-loader-{}.jar",
            loader_version, loader_version
        );

        if verify_and_download_file(&primary_url, &target_jar, None).await.is_err() {
            let _ = verify_and_download_file(&mirror_url, &target_jar, None).await;
        }
    }
    Ok(())
}
pub async fn ensure_required_asm_libraries(game_dir: &str) -> Result<(), String> {
    let libraries_dir = PathBuf::from(game_dir).join("libraries");
    let core_libs = vec![
        ("org/ow2/asm/asm/9.6/asm-9.6.jar", "https://maven.fabricmc.net/org/ow2/asm/asm/9.6/asm-9.6.jar"),
        ("org/ow2/asm/asm-tree/9.6/asm-tree-9.6.jar", "https://maven.fabricmc.net/org/ow2/asm/asm-tree/9.6/asm-tree-9.6.jar"),
        ("org/ow2/asm/asm-commons/9.6/asm-commons-9.6.jar", "https://maven.fabricmc.net/org/ow2/asm/asm-commons/9.6/asm-commons-9.6.jar"),
        ("org/ow2/asm/asm-util/9.6/asm-util-9.6.jar", "https://maven.fabricmc.net/org/ow2/asm/asm-util/9.6/asm-util-9.6.jar"),
        ("org/ow2/asm/asm-analysis/9.6/asm-analysis-9.6.jar", "https://maven.fabricmc.net/org/ow2/asm/asm-analysis/9.6/asm-analysis-9.6.jar"),
        ("org/spongepowered/mixin/0.12.5+mixin.0.8.5/mixin-0.12.5+mixin.0.8.5.jar", "https://maven.fabricmc.net/org/spongepowered/mixin/0.12.5+mixin.0.8.5/mixin-0.12.5+mixin.0.8.5.jar"),
        ("net/fabricmc/sponge-mixin/0.12.5+mixin.0.8.5/sponge-mixin-0.12.5+mixin.0.8.5.jar", "https://maven.fabricmc.net/net/fabricmc/sponge-mixin/0.12.5+mixin.0.8.5/sponge-mixin-0.12.5+mixin.0.8.5.jar"),
        ("net/fabricmc/sponge-mixin/0.15.3+mixin.0.8.7/sponge-mixin-0.15.3+mixin.0.8.7.jar", "https://maven.fabricmc.net/net/fabricmc/sponge-mixin/0.15.3+mixin.0.8.7/sponge-mixin-0.15.3+mixin.0.8.7.jar"),
    ];

    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0")
        .build()
        .map_err(|e| e.to_string())?;

    for (rel_path, fabric_url) in core_libs {
        let local_jar = libraries_dir.join(rel_path);
        let need_download = !local_jar.exists() || fs::metadata(&local_jar).map(|m| m.len()).unwrap_or(0) < 5000;

        if need_download {
            if let Some(parent) = local_jar.parent() {
                fs::create_dir_all(parent).ok();
            }

            let urls = vec![
                fabric_url.to_string(),
                format!("https://libraries.minecraft.net/{}", rel_path),
                format!("https://bmclapi2.bangbang93.com/maven/{}", rel_path),
            ];

            for u in urls {
                if let Ok(res) = client.get(&u).send().await {
                    if res.status().is_success() {
                        if let Ok(bytes) = res.bytes().await {
                            if bytes.len() > 5000 {
                                let _ = fs::write(&local_jar, &bytes);
                                break;
                            }
                        }
                    }
                }
            }
        }
    }
    Ok(())
}

pub async fn ensure_version_libraries_downloaded(game_dir: &str, version_id: &str) -> Result<(), String> {
    let _ = ensure_required_asm_libraries(game_dir).await;
    let base_path = PathBuf::from(game_dir);
    let libraries_dir = base_path.join("libraries");
    let json_path = base_path.join("versions").join(version_id).join(format!("{}.json", version_id));

    if json_path.exists() {
        if let Ok(content) = fs::read_to_string(&json_path) {
            if let Ok(parsed) = serde_json::from_str::<VersionPackageJson>(&content) {
                if let Some(libs) = parsed.libraries {
                    for item in libs {
                        if let Some(ref maven_name) = item.name {
                            if let Some((url, rel_path)) = maven_to_url(maven_name) {
                                let local_jar = libraries_dir.join(rel_path);
                                if !local_jar.exists() {
                                    let _ = verify_and_download_file(&url, &local_jar, None).await;
                                    if !local_jar.exists() && url.contains("maven.fabricmc.net") {
                                        let mirror_url = url.replace("https://maven.fabricmc.net", "https://bmclapi2.bangbang93.com/maven");
                                        let _ = verify_and_download_file(&mirror_url, &local_jar, None).await;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    Ok(())
}

#[derive(Deserialize)]
struct ModrinthVersionFile {
    url: String,
    filename: String,
}

#[derive(Deserialize)]
struct ModrinthVersionResponse {
    files: Vec<ModrinthVersionFile>,
}

pub async fn download_modrinth_mod_to_dir(
    mods_dir: &Path,
    slug: &str,
    game_version: &str,
) -> Result<(), String> {
    let client = reqwest::Client::builder()
        .user_agent("MCLauncher/4.2.1")
        .build()
        .map_err(|e| e.to_string())?;

    let url = format!(
        "https://api.modrinth.com/v2/project/{}/version?game_versions=[\"{}\"]&loaders=[\"fabric\"]",
        slug, game_version
    );

    if let Ok(res) = client.get(&url).send().await {
        if res.status().is_success() {
            if let Ok(versions) = res.json::<Vec<ModrinthVersionResponse>>().await {
                if let Some(first_ver) = versions.first() {
                    if let Some(primary_file) = first_ver.files.first() {
                        let target_file = mods_dir.join(&primary_file.filename);
                        if !target_file.exists() {
                            let _ = verify_and_download_file(&primary_file.url, &target_file, None).await;
                        }
                    }
                }
            }
        }
    }
    Ok(())
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
    if !versions_dir.exists() {
        return Ok(());
    }

    let mut deleted_count = 0;

    // 1. Thử xóa chính xác đường dẫn trực tiếp
    let exact_dir = versions_dir.join(version_id);
    if exact_dir.exists() {
        fs::remove_dir_all(&exact_dir)
            .map_err(|e| format!("Không thể xóa thư mục '{}': {}. Vui lòng đóng game trước khi xóa!", exact_dir.display(), e))?;
        deleted_count += 1;
    }

    // 2. Thử xóa đường dẫn tên suffix '-latest' đúng 1-1
    let latest_dir = versions_dir.join(format!("{}-latest", version_id));
    if latest_dir.exists() {
        fs::remove_dir_all(&latest_dir)
            .map_err(|e| format!("Không thể xóa thư mục '{}': {}. Vui lòng đóng game trước khi xóa!", latest_dir.display(), e))?;
        deleted_count += 1;
    }

    // 3. Nếu version_id có chứa '-latest' (Ví dụ: version_id là '1.21.1-iris-latest' -> folder là '1.21.1-iris')
    if version_id.ends_with("-latest") {
        let base_id = version_id.trim_end_matches("-latest");
        let base_dir = versions_dir.join(base_id);
        if base_dir.exists() {
            fs::remove_dir_all(&base_dir)
                .map_err(|e| format!("Không thể xóa thư mục '{}': {}. Vui lòng đóng game trước khi xóa!", base_dir.display(), e))?;
            deleted_count += 1;
        }
    }

    if deleted_count == 0 {
        return Err(format!("Không tìm thấy thư mục phiên bản '{}' trên đĩa cứng để xóa!", version_id));
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

pub async fn ensure_bundle_version_files(
    _game_dir: &str,
    target_dir: &Path,
    game_version: &str,
    version_id: &str,
) -> Result<(), String> {
    // 1. Khởi tạo cấu trúc thư mục chuẩn TLauncher (mods, shaderpacks, resourcepacks, saves)
    let mods_dir = target_dir.join("mods");
    let shaderpacks_dir = target_dir.join("shaderpacks");
    let resourcepacks_dir = target_dir.join("resourcepacks");
    let saves_dir = target_dir.join("saves");

    fs::create_dir_all(&mods_dir).ok();
    fs::create_dir_all(&shaderpacks_dir).ok();
    fs::create_dir_all(&resourcepacks_dir).ok();
    fs::create_dir_all(&saves_dir).ok();

    let client_jar = target_dir.join(format!("{}.jar", version_id));

    // Nếu file chưa có hoặc nhỏ hơn 1MB (file lỗi HTML 404), bắt buộc tải lại file client.jar chuẩn ~30MB
    let need_download = !client_jar.exists() || fs::metadata(&client_jar).map(|m| m.len()).unwrap_or(0) < 1_000_000;

    if need_download {
        let manifest = crate::version_manifest::fetch_vanilla_versions().await.ok();
        let mut downloaded = false;

        if let Some(m) = manifest {
            if let Some(v_item) = m.versions.iter().find(|v| v.id == game_version) {
                if let Ok(res) = reqwest::get(&v_item.url).await {
                    if let Ok(pkg) = res.json::<VersionPackageJson>().await {
                        if verify_and_download_file(&pkg.downloads.client.url, &client_jar, None).await.is_ok() {
                            if fs::metadata(&client_jar).map(|m| m.len()).unwrap_or(0) > 1_000_000 {
                                downloaded = true;
                            }
                        }
                    }
                }
            }
        }

        if !downloaded {
            // Tải từ mirror BMCLAPI hoặc Mojang Official Client URL 1.21.1 (~30MB)
            let mirror_urls = vec![
                format!("https://bmclapi2.bangbang93.com/version/{}/client", game_version),
                "https://piston-data.mojang.com/v1/objects/45068820c7e2b694b8e21fdf164906f0e4b8ed6c/client.jar".to_string(),
                "https://bmclapi2.bangbang93.com/version/1.21.1/client".to_string(),
            ];

            for u in mirror_urls {
                let _ = verify_and_download_file(&u, &client_jar, None).await;
                if fs::metadata(&client_jar).map(|m| m.len()).unwrap_or(0) > 1_000_000 {
                    break;
                }
            }
        }
    }

    Ok(())
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
        ModLoaderType::Vanilla => {
            let target_dir = versions_dir.join(game_version);
            fs::create_dir_all(&target_dir).ok();
            let _ = ensure_bundle_version_files(game_dir, &target_dir, game_version, game_version).await;
            Ok(game_version.to_string())
        }
        ModLoaderType::Fabric => {
            let version_id = format!("{}-fabric-{}", game_version, loader_version);
            let target_dir = versions_dir.join(&version_id);
            fs::create_dir_all(&target_dir).map_err(|e| e.to_string())?;

            let _ = ensure_bundle_version_files(game_dir, &target_dir, game_version, &version_id).await;

            let profile_url = format!(
                "https://meta.fabricmc.net/v2/versions/loader/{}/{}/profile/json",
                game_version, loader_version
            );
            let client = reqwest::Client::new();
            let mut wrote_json = false;
            if let Ok(res) = client.get(&profile_url).send().await {
                if res.status().is_success() {
                    if let Ok(text) = res.text().await {
                        if text.contains("mainClass") {
                            fs::write(target_dir.join(format!("{}.json", version_id)), text).ok();
                            wrote_json = true;
                        }
                    }
                }
            }

            if !wrote_json {
                let fallback_json = format!(
                    "{{\n  \"id\": \"{}\",\n  \"inheritsFrom\": \"{}\",\n  \"type\": \"release\",\n  \"mainClass\": \"net.fabricmc.loader.impl.launch.knot.KnotClient\",\n  \"libraries\": [\n    {{\"name\": \"net.fabricmc:fabric-loader:0.16.0\"}},\n    {{\"name\": \"net.fabricmc:intermediary:{}\"}}\n  ]\n}}",
                    version_id, game_version, game_version
                );
                fs::write(target_dir.join(format!("{}.json", version_id)), fallback_json).ok();
            }

            let actual_loader_ver = if loader_version == "latest" { "0.16.0" } else { loader_version };
            let _ = ensure_fabric_loader_jar(game_dir, actual_loader_ver).await;
            let _ = ensure_version_libraries_downloaded(game_dir, &version_id).await;

            Ok(version_id)
        }
        ModLoaderType::Forge => {
            let version_id = format!("{}-forge-{}", game_version, loader_version);
            let target_dir = versions_dir.join(&version_id);
            fs::create_dir_all(&target_dir).map_err(|e| e.to_string())?;
            let _ = ensure_bundle_version_files(game_dir, &target_dir, game_version, &version_id).await;
            Ok(version_id)
        }
        ModLoaderType::Quilt => {
            let version_id = format!("{}-quilt-{}", game_version, loader_version);
            let target_dir = versions_dir.join(&version_id);
            fs::create_dir_all(&target_dir).map_err(|e| e.to_string())?;

            let _ = ensure_bundle_version_files(game_dir, &target_dir, game_version, &version_id).await;

            let profile_url = format!(
                "https://meta.quiltmc.org/v3/versions/loader/{}/{}/profile/json",
                game_version, loader_version
            );
            let client = reqwest::Client::new();
            let mut wrote_json = false;
            if let Ok(res) = client.get(&profile_url).send().await {
                if res.status().is_success() {
                    if let Ok(text) = res.text().await {
                        if text.contains("mainClass") {
                            fs::write(target_dir.join(format!("{}.json", version_id)), text).ok();
                            wrote_json = true;
                        }
                    }
                }
            }

            if !wrote_json {
                let fallback_json = format!(
                    "{{\n  \"id\": \"{}\",\n  \"inheritsFrom\": \"{}\",\n  \"type\": \"release\",\n  \"mainClass\": \"org.quiltmc.loader.impl.launch.knot.KnotClient\",\n  \"libraries\": [\n    {{\"name\": \"org.quiltmc:quilt-loader:0.26.0\"}}\n  ]\n}}",
                    version_id, game_version
                );
                fs::write(target_dir.join(format!("{}.json", version_id)), fallback_json).ok();
            }

            let _ = ensure_version_libraries_downloaded(game_dir, &version_id).await;
            Ok(version_id)
        }
        ModLoaderType::NeoForge => {
            let version_id = format!("{}-neoforge-{}", game_version, loader_version);
            let target_dir = versions_dir.join(&version_id);
            fs::create_dir_all(&target_dir).map_err(|e| e.to_string())?;
            let _ = ensure_bundle_version_files(game_dir, &target_dir, game_version, &version_id).await;
            Ok(version_id)
        }
        ModLoaderType::OptiFine => {
            let version_id = format!("{}-optifine-{}", game_version, loader_version);
            let target_dir = versions_dir.join(&version_id);
            fs::create_dir_all(&target_dir).map_err(|e| e.to_string())?;
            let _ = ensure_bundle_version_files(game_dir, &target_dir, game_version, &version_id).await;
            Ok(version_id)
        }
        ModLoaderType::Iris => {
            let version_id = format!("{}-iris-{}", game_version, loader_version);
            let target_dir = versions_dir.join(&version_id);
            fs::create_dir_all(&target_dir).map_err(|e| e.to_string())?;

            let _ = ensure_bundle_version_files(game_dir, &target_dir, game_version, &version_id).await;

            // 1. Iris Shaders sử dụng nền Fabric Loader
            let profile_url = format!(
                "https://meta.fabricmc.net/v2/versions/loader/{}/0.16.0/profile/json",
                game_version
            );
            let client = reqwest::Client::new();
            let mut wrote_json = false;
            if let Ok(res) = client.get(&profile_url).send().await {
                if res.status().is_success() {
                    if let Ok(text) = res.text().await {
                        if text.contains("mainClass") {
                            fs::write(target_dir.join(format!("{}.json", version_id)), text).ok();
                            wrote_json = true;
                        }
                    }
                }
            }

            if !wrote_json {
                let fallback_json = format!(
                    "{{\n  \"id\": \"{}\",\n  \"inheritsFrom\": \"{}\",\n  \"type\": \"release\",\n  \"mainClass\": \"net.fabricmc.loader.impl.launch.knot.KnotClient\",\n  \"libraries\": [\n    {{\"name\": \"net.fabricmc:fabric-loader:0.16.0\"}},\n    {{\"name\": \"net.fabricmc:intermediary:{}\"}}\n  ]\n}}",
                    version_id, game_version, game_version
                );
                fs::write(target_dir.join(format!("{}.json", version_id)), fallback_json).ok();
            }

            // 2. Tự động tải Iris Shaders & Sodium Engine Mod từ Modrinth API vào thư mục versions/{version_id}/mods/
            let local_mods_dir = target_dir.join("mods");
            let global_mods_dir = base_path.join("mods");
            fs::create_dir_all(&local_mods_dir).ok();
            fs::create_dir_all(&global_mods_dir).ok();

            let _ = download_modrinth_mod_to_dir(&local_mods_dir, "iris", game_version).await;
            let _ = download_modrinth_mod_to_dir(&local_mods_dir, "sodium", game_version).await;
            let _ = download_modrinth_mod_to_dir(&global_mods_dir, "iris", game_version).await;
            let _ = download_modrinth_mod_to_dir(&global_mods_dir, "sodium", game_version).await;

            let _ = ensure_fabric_loader_jar(game_dir, "0.16.0").await;
            let _ = ensure_version_libraries_downloaded(game_dir, &version_id).await;

            Ok(version_id)
        }
    }
}

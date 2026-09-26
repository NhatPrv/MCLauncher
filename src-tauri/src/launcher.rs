use std::process::Command as SysCommand;
use std::path::{Path, PathBuf};
use std::fs;
use std::collections::HashMap;
use crate::config::{AppConfig, detect_java_path};
use crate::auth::Account;

use serde::Deserialize;

#[derive(Deserialize)]
struct LibraryArtifact {
    path: Option<String>,
}

#[derive(Deserialize)]
struct LibraryDownloads {
    artifact: Option<LibraryArtifact>,
}

#[derive(Deserialize)]
struct LibraryNameItem {
    name: Option<String>,
    downloads: Option<LibraryDownloads>,
}

#[derive(Deserialize)]
struct AssetIndexInfo {
    id: Option<String>,
}

#[derive(Deserialize, Debug, Clone)]
struct VersionArguments {
    game: Option<Vec<serde_json::Value>>,
    jvm: Option<Vec<serde_json::Value>>,
}

#[derive(Deserialize)]
struct VersionManifestJson {
    #[serde(rename = "mainClass")]
    main_class: Option<String>,
    #[serde(rename = "inheritsFrom")]
    inherits_from: Option<String>,
    libraries: Option<Vec<LibraryNameItem>>,
    #[serde(rename = "assetIndex")]
    asset_index: Option<AssetIndexInfo>,
    assets: Option<String>,
    arguments: Option<VersionArguments>,
    #[serde(rename = "minecraftArguments")]
    minecraft_arguments: Option<String>,
}

fn is_rule_allowed(rule_obj: &serde_json::Value) -> bool {
    let action = rule_obj.get("action").and_then(|a| a.as_str()).unwrap_or("allow");
    let is_allow = action == "allow";

    if let Some(features) = rule_obj.get("features").and_then(|f| f.as_object()) {
        for (feat_name, feat_val) in features {
            let required_val = feat_val.as_bool().unwrap_or(false);
            if feat_name == "has_custom_resolution" {
                if !required_val {
                    return !is_allow;
                }
            } else {
                // Các tính năng demo, quick play không kích hoạt theo mặc định
                if required_val {
                    return !is_allow;
                }
            }
        }
    }

    if let Some(os_obj) = rule_obj.get("os") {
        if let Some(os_name) = os_obj.get("name").and_then(|n| n.as_str()) {
            let current_os = if cfg!(target_os = "windows") {
                "windows"
            } else if cfg!(target_os = "macos") {
                "osx"
            } else {
                "linux"
            };
            if os_name != current_os {
                return !is_allow;
            }
        }
    }
    is_allow
}

fn extract_arg_values(val: &serde_json::Value) -> Vec<String> {
    if let Some(s) = val.as_str() {
        return vec![s.to_string()];
    }
    if let Some(obj) = val.as_object() {
        if let Some(rules) = obj.get("rules").and_then(|r| r.as_array()) {
            let mut allowed = false;
            for r in rules {
                if is_rule_allowed(r) {
                    allowed = true;
                } else {
                    allowed = false;
                }
            }
            if !allowed {
                return Vec::new();
            }
        }
        if let Some(value_node) = obj.get("value") {
            if let Some(s) = value_node.as_str() {
                return vec![s.to_string()];
            } else if let Some(arr) = value_node.as_array() {
                return arr.iter().filter_map(|v| v.as_str().map(|s| s.to_string())).collect();
            }
        }
    }
    Vec::new()
}

fn substitute_placeholders(input: &str, vars: &HashMap<&str, &str>) -> String {
    let mut result = input.to_string();
    for (k, v) in vars {
        let pattern = format!("${{{}}}", k);
        result = result.replace(&pattern, v);
    }
    result
}

fn get_main_class_for_version(game_dir: &Path, version_id: &str) -> String {
    let mut versions_to_check = vec![
        version_id.to_string(),
        version_id.split('-').next().unwrap_or(version_id).to_string(),
    ];
    let mut checked_set = std::collections::HashSet::new();
    while let Some(ver) = versions_to_check.pop() {
        if !checked_set.insert(ver.clone()) {
            continue;
        }
        let json_path = game_dir.join("versions").join(&ver).join(format!("{}.json", ver));
        if json_path.exists() {
            if let Ok(content) = fs::read_to_string(&json_path) {
                if let Ok(parsed) = serde_json::from_str::<VersionManifestJson>(&content) {
                    if let Some(mc) = parsed.main_class {
                        if !mc.trim().is_empty() {
                            return mc;
                        }
                    }
                    if let Some(parent_ver) = parsed.inherits_from {
                        if !parent_ver.trim().is_empty() {
                            versions_to_check.push(parent_ver);
                        }
                    }
                }
            }
        }
    }
    "net.minecraft.client.main.Main".to_string()
}

fn get_manifest_arguments(
    game_dir: &Path,
    version_id: &str,
) -> (Vec<String>, Vec<String>, Option<String>) {
    let mut jvm_args = Vec::new();
    let mut game_args = Vec::new();
    let mut legacy_args = None;

    let mut versions_to_check = vec![
        version_id.to_string(),
        version_id.split('-').next().unwrap_or(version_id).to_string(),
    ];
    let mut checked_set = std::collections::HashSet::new();

    while let Some(ver) = versions_to_check.pop() {
        if !checked_set.insert(ver.clone()) {
            continue;
        }
        let json_path = game_dir.join("versions").join(&ver).join(format!("{}.json", ver));
        if json_path.exists() {
            if let Ok(content) = fs::read_to_string(&json_path) {
                if let Ok(parsed) = serde_json::from_str::<VersionManifestJson>(&content) {
                    if let Some(ref args) = parsed.arguments {
                        if let Some(ref jvm_list) = args.jvm {
                            for item in jvm_list {
                                jvm_args.extend(extract_arg_values(item));
                            }
                        }
                        if game_args.is_empty() {
                            if let Some(ref game_list) = args.game {
                                for item in game_list {
                                    game_args.extend(extract_arg_values(item));
                                }
                            }
                        }
                    }
                    if legacy_args.is_none() {
                        if let Some(ref mc_args) = parsed.minecraft_arguments {
                            legacy_args = Some(mc_args.clone());
                        }
                    }
                    if let Some(parent_ver) = parsed.inherits_from {
                        if !parent_ver.trim().is_empty() {
                            versions_to_check.push(parent_ver);
                        }
                    }
                }
            }
        }
    }

    (jvm_args, game_args, legacy_args)
}

fn get_asset_index_for_version(game_dir: &Path, version_id: &str) -> String {
    let mut versions_to_check = vec![
        version_id.to_string(),
        version_id.split('-').next().unwrap_or(version_id).to_string(),
    ];
    let mut checked_set = std::collections::HashSet::new();
    while let Some(ver) = versions_to_check.pop() {
        if !checked_set.insert(ver.clone()) {
            continue;
        }
        let json_path = game_dir.join("versions").join(&ver).join(format!("{}.json", ver));
        if json_path.exists() {
            if let Ok(content) = fs::read_to_string(&json_path) {
                if let Ok(parsed) = serde_json::from_str::<VersionManifestJson>(&content) {
                    if let Some(ref ai) = parsed.asset_index {
                        if let Some(ref id) = ai.id {
                            if !id.trim().is_empty() {
                                return id.clone();
                            }
                        }
                    }
                    if let Some(ref a) = parsed.assets {
                        if !a.trim().is_empty() {
                            return a.clone();
                        }
                    }
                    if let Some(parent_ver) = parsed.inherits_from {
                        if !parent_ver.trim().is_empty() {
                            versions_to_check.push(parent_ver);
                        }
                    }
                }
            }
        }
    }
    version_id.split('-').next().unwrap_or(version_id).to_string()
}

fn maven_to_local_path(maven_name: &str) -> Option<PathBuf> {
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
    Some(PathBuf::from(rel_path))
}

fn extract_semver(p: &Path) -> Vec<u32> {
    if let Some(parent) = p.parent() {
        if let Some(folder_name) = parent.file_name().and_then(|s| s.to_str()) {
            return folder_name
                .split(|c: char| !c.is_numeric())
                .filter_map(|s| s.parse().ok())
                .collect();
        }
    }
    Vec::new()
}

fn compare_semver_paths(a: &Path, b: &Path) -> std::cmp::Ordering {
    let ver_a = extract_semver(a);
    let ver_b = extract_semver(b);

    let max_len = std::cmp::max(ver_a.len(), ver_b.len());
    for i in 0..max_len {
        let num_a = ver_a.get(i).cloned().unwrap_or(0);
        let num_b = ver_b.get(i).cloned().unwrap_or(0);
        if num_a != num_b {
            return num_b.cmp(&num_a); // Giảm dần: bản số lớn nhất đứng trước (10.0 > 8.0 > 4.0)
        }
    }
    b.cmp(a)
}

fn collect_jars_recursive(dir: &Path, jar_paths: &mut Vec<String>) {
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                collect_jars_recursive(&path, jar_paths);
            } else if path.extension().and_then(|s| s.to_str()) == Some("jar") {
                jar_paths.push(path.to_string_lossy().to_string());
            }
        }
    }
}

/// Thu thập danh sách Classpath chuẩn mực từ JSON Manifest của phiên bản game
fn collect_libraries_for_version(game_dir: &Path, version_id: &str) -> Vec<String> {
    let libraries_dir = game_dir.join("libraries");
    let mut manifest_jars = Vec::new();

    let mut versions_to_check = vec![
        version_id.to_string(),
        version_id.split('-').next().unwrap_or(version_id).to_string(),
    ];

    // 1. Nạp tất cả libraries từ cả Mod Loader JSON lẫn Vanilla JSON (hỗ trợ kế thừa inheritsFrom)
    let mut checked_set = std::collections::HashSet::new();
    while let Some(ver) = versions_to_check.pop() {
        if !checked_set.insert(ver.clone()) {
            continue;
        }
        let json_path = game_dir.join("versions").join(&ver).join(format!("{}.json", ver));
        if json_path.exists() {
            if let Ok(content) = fs::read_to_string(&json_path) {
                if let Ok(parsed) = serde_json::from_str::<VersionManifestJson>(&content) {
                    if let Some(parent_ver) = parsed.inherits_from {
                        if !parent_ver.trim().is_empty() {
                            versions_to_check.push(parent_ver);
                        }
                    }
                    if let Some(libs) = parsed.libraries {
                        for lib_item in libs {
                            let mut resolved_path = None;
                            if let Some(ref downloads) = lib_item.downloads {
                                if let Some(ref artifact) = downloads.artifact {
                                    if let Some(ref p) = artifact.path {
                                        resolved_path = Some(PathBuf::from(p));
                                    }
                                }
                            }
                            if resolved_path.is_none() {
                                if let Some(ref maven_name) = lib_item.name {
                                    resolved_path = maven_to_local_path(maven_name);
                                }
                            }
                            if let Some(rel_path) = resolved_path {
                                let full_jar = libraries_dir.join(rel_path);
                                if full_jar.exists() {
                                    manifest_jars.push(full_jar.to_string_lossy().to_string());
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    if !manifest_jars.is_empty() {
        manifest_jars.sort();
        manifest_jars.dedup();
        return manifest_jars;
    }

    // Fallback: Thu thập và ưu tiên phiên bản thư viện mới nhất theo Semver số nguyên
    let mut raw_jars = Vec::new();
    if libraries_dir.exists() {
        collect_jars_recursive(&libraries_dir, &mut raw_jars);
    }

    let mut artifact_map: HashMap<String, Vec<PathBuf>> = HashMap::new();
    for jar_str in raw_jars {
        let p = PathBuf::from(&jar_str);
        if let Some(parent) = p.parent() {
            if let Some(artifact_dir) = parent.parent() {
                let key = artifact_dir.to_string_lossy().to_string();
                artifact_map.entry(key).or_default().push(p);
                continue;
            }
        }
        artifact_map.entry(jar_str.clone()).or_default().push(p);
    }

    let mut final_jars = Vec::new();
    for (_key, mut paths) in artifact_map {
        paths.sort_by(|a, b| compare_semver_paths(a, b));
        if let Some(best) = paths.first() {
            final_jars.push(best.to_string_lossy().to_string());
        }
    }

    final_jars.sort();
    final_jars
}

use std::fs::File;
use zip::ZipArchive;

fn extract_natives(game_dir: &Path, version_id: &str) -> PathBuf {
    let natives_dir = game_dir.join("versions").join(version_id).join("natives");
    // Xóa sạch thư mục natives cũ để loại bỏ file dll ARM64 bị giải nén nhầm trước đó
    let _ = fs::remove_dir_all(&natives_dir);
    let _ = fs::create_dir_all(&natives_dir);

    let libraries_dir = game_dir.join("libraries");
    if libraries_dir.exists() {
        let mut all_jars = Vec::new();
        collect_jars_recursive(&libraries_dir, &mut all_jars);
        for jar_path_str in all_jars {
            let p = Path::new(&jar_path_str);
            let file_name = p.file_name().and_then(|s| s.to_str()).unwrap_or("");
            let file_name_lower = file_name.to_lowercase();
            
            let is_native = (file_name_lower.contains("natives-windows") || file_name_lower.contains("natives_windows"))
                && !file_name_lower.contains("arm")
                && !file_name_lower.contains("aarch64")
                && !file_name_lower.contains("x86_32")
                && !file_name_lower.contains("i686");

            if is_native {
                if let Ok(file) = File::open(p) {
                    if let Ok(mut archive) = ZipArchive::new(file) {
                        for i in 0..archive.len() {
                            if let Ok(mut entry) = archive.by_index(i) {
                                let name = entry.name().to_string();
                                let name_lower = name.to_lowercase();
                                if name_lower.ends_with(".dll") {
                                    if name_lower.contains("arm64")
                                        || name_lower.contains("aarch64")
                                        || name_lower.contains("arm32")
                                        || name_lower.contains("x86/")
                                        || name_lower.contains("x86\\")
                                    {
                                        continue;
                                    }
                                    if let Some(target_filename) = Path::new(&name).file_name() {
                                        let target_dll = natives_dir.join(target_filename);
                                        if let Ok(mut out) = File::create(&target_dll) {
                                            let _ = std::io::copy(&mut entry, &mut out);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    natives_dir
}

pub fn launch_game(
    version_id: &str,
    account: &Account,
    config: &AppConfig,
) -> Result<u32, String> {
    let game_dir = PathBuf::from(&config.game_dir);
    let assets_dir = game_dir.join("assets");
    let version_dir = game_dir.join("versions").join(version_id);
    
    // Tự động tìm Client Jar thích hợp
    let client_jar = version_dir.join(format!("{}.jar", version_id));

    // Fallback sang vanilla jar nếu bản mod loader chưa tạo jar riêng hoặc file jar hiện tại < 20MB
    let actual_jar = if client_jar.exists() && fs::metadata(&client_jar).map(|m| m.len()).unwrap_or(0) >= 20_000_000 {
        client_jar
    } else {
        let vanilla_ver = version_id.split('-').next().unwrap_or(version_id);
        let fallback = game_dir
            .join("versions")
            .join(vanilla_ver)
            .join(format!("{}.jar", vanilla_ver));
        if fallback.exists() && fs::metadata(&fallback).map(|m| m.len()).unwrap_or(0) >= 20_000_000 {
            fallback
        } else {
            client_jar
        }
    };

    if !actual_jar.exists() || fs::metadata(&actual_jar).map(|m| m.len()).unwrap_or(0) < 20_000_000 {
        return Err(format!(
            "File Minecraft Client jar tại '{}' chưa đầy đủ (cần ~30MB). Vui lòng bấm nút 'Tải về' hoặc bấm 'Play' để tự động tải lại file chuẩn của Mojang!",
            actual_jar.display()
        ));
    }

    // Ưu tiên phát hiện Java 21 / JDK 17 nếu config đang là "java" mặc định
    let java_bin = if config.java_path.trim().is_empty() || config.java_path.trim() == "java" {
        detect_java_path().unwrap_or_else(|| "java".to_string())
    } else {
        config.java_path.clone()
    };

    let min_ram_arg = format!("-Xms{}M", config.min_ram_mb);
    let max_ram_arg = format!("-Xmx{}M", config.max_ram_mb);

    // Trích xuất Native DLLs của LWJGL cho Windows
    let natives_dir = extract_natives(&game_dir, version_id);
    let natives_path_str = natives_dir.to_string_lossy().to_string();

    // Thu thập danh sách Classpath chính xác 100% từ JSON Manifest của phiên bản game
    let mut jar_list = vec![actual_jar.to_string_lossy().to_string()];
    let version_libs = collect_libraries_for_version(&game_dir, version_id);
    jar_list.extend(version_libs);

    let mut final_jars = jar_list;
    final_jars.sort();
    final_jars.dedup();

    // Debug: log classpath để kiểm tra
    eprintln!("[MCLauncher DEBUG] Classpath entries ({} jars):", final_jars.len());
    for j in &final_jars {
        eprintln!("  CP: {}", j);
    }

    final_jars.sort();

    // Debug: log classpath để phát hiện lỗi thiếu thư viện
    eprintln!("[MCLauncher DEBUG] Classpath entries ({} jars):", final_jars.len());
    for j in &final_jars {
        eprintln!("  CP: {}", j);
    }

    // Classpath construction
    let cp_separator = if cfg!(windows) { ";" } else { ":" };
    let classpath = final_jars.join(cp_separator);

    let vanilla_version_str = version_id.split('-').next().unwrap_or(version_id);
    let main_class_to_run = get_main_class_for_version(&game_dir, version_id);
    let game_dir_to_use = if version_dir.exists() {
        version_dir.to_string_lossy().to_string()
    } else {
        game_dir.to_string_lossy().to_string()
    };

    let asset_index_to_use = get_asset_index_for_version(&game_dir, version_id);
    let assets_dir_str = assets_dir.to_string_lossy().to_string();
    let libraries_dir_str = game_dir.join("libraries").to_string_lossy().to_string();
    let width_str = config.resolution_width.to_string();
    let height_str = config.resolution_height.to_string();

    let mut placeholder_vars = HashMap::new();
    placeholder_vars.insert("auth_player_name", account.username.as_str());
    placeholder_vars.insert("version_name", version_id);
    placeholder_vars.insert("game_directory", game_dir_to_use.as_str());
    placeholder_vars.insert("assets_root", assets_dir_str.as_str());
    placeholder_vars.insert("game_assets", assets_dir_str.as_str());
    placeholder_vars.insert("assets_index_name", asset_index_to_use.as_str());
    placeholder_vars.insert("auth_uuid", account.uuid.as_str());
    placeholder_vars.insert("auth_access_token", account.access_token.as_str());
    placeholder_vars.insert("user_type", "mojang");
    placeholder_vars.insert("version_type", "release");
    placeholder_vars.insert("natives_directory", natives_path_str.as_str());
    placeholder_vars.insert("classpath", classpath.as_str());
    placeholder_vars.insert("library_directory", libraries_dir_str.as_str());
    placeholder_vars.insert("classpath_separator", cp_separator);
    placeholder_vars.insert("launcher_name", "MCLauncher");
    placeholder_vars.insert("launcher_version", "4.2.1");
    placeholder_vars.insert("user_properties", "{}");
    placeholder_vars.insert("resolution_width", width_str.as_str());
    placeholder_vars.insert("resolution_height", height_str.as_str());
    placeholder_vars.insert("clientid", "0");
    placeholder_vars.insert("auth_xuid", "");

    let (manifest_jvm_args, manifest_game_args, legacy_mc_args) =
        get_manifest_arguments(&game_dir, version_id);

    let mut args: Vec<String> = vec![
        min_ram_arg,
        max_ram_arg,
        format!("-Djava.library.path={}", natives_path_str),
        format!("-Dorg.lwjgl.librarypath={}", natives_path_str),
        "-Dminecraft.launcher.brand=MCLauncher".to_string(),
        "-Dminecraft.launcher.version=4.2.1".to_string(),
    ];

    if !config.jvm_args.trim().is_empty() {
        for arg in config.jvm_args.split_whitespace() {
            args.push(arg.to_string());
        }
    }

    // Nạp thêm JVM arguments từ Manifest (như module opens/exports của Forge)
    for jvm_item in manifest_jvm_args {
        let substituted = substitute_placeholders(&jvm_item, &placeholder_vars);
        if substituted.starts_with("-Djava.library.path=")
            || substituted == "-cp"
            || substituted == classpath
        {
            continue;
        }
        args.push(substituted);
    }

    args.push("-cp".to_string());
    args.push(classpath.clone());
    args.push(main_class_to_run);

    // Nạp Game arguments
    if !manifest_game_args.is_empty() {
        let mut has_width = false;
        let mut has_height = false;
        for g_arg in manifest_game_args {
            let substituted = substitute_placeholders(&g_arg, &placeholder_vars);
            if substituted == "--width" {
                has_width = true;
            }
            if substituted == "--height" {
                has_height = true;
            }
            args.push(substituted);
        }
        if !has_width {
            args.push("--width".to_string());
            args.push(width_str);
        }
        if !has_height {
            args.push("--height".to_string());
            args.push(height_str);
        }
    } else if let Some(mc_args) = legacy_mc_args {
        let mut has_width = false;
        let mut has_height = false;
        for token in mc_args.split_whitespace() {
            let substituted = substitute_placeholders(token, &placeholder_vars);
            if substituted == "--width" {
                has_width = true;
            }
            if substituted == "--height" {
                has_height = true;
            }
            args.push(substituted);
        }
        if !has_width {
            args.push("--width".to_string());
            args.push(width_str);
        }
        if !has_height {
            args.push("--height".to_string());
            args.push(height_str);
        }
    } else {
        // Fallback chuẩn Vanilla
        args.extend(vec![
            "--username".to_string(),
            account.username.clone(),
            "--version".to_string(),
            vanilla_version_str.to_string(),
            "--gameDir".to_string(),
            game_dir_to_use,
            "--assetsDir".to_string(),
            assets_dir_str,
            "--assetIndex".to_string(),
            asset_index_to_use,
            "--uuid".to_string(),
            account.uuid.clone(),
            "--accessToken".to_string(),
            account.access_token.clone(),
            "--userType".to_string(),
            "mojang".to_string(),
            "--width".to_string(),
            width_str,
            "--height".to_string(),
            height_str,
        ]);
    }

    // Giải quyết triệt để lỗi OS error 206 (Command line too long trên Windows):
    // Sử dụng tính năng Java @argfile truyền toàn bộ tham số qua file jvm_args.txt
    let argfile_path = game_dir.join("jvm_args.txt");
    let formatted_content = args
        .iter()
        .map(|s| {
            if s.contains(' ') || s.contains('\\') || s.contains(';') {
                format!("\"{}\"", s.replace('\\', "\\\\").replace('"', "\\\""))
            } else {
                s.clone()
            }
        })
        .collect::<Vec<_>>()
        .join("\n");

    fs::write(&argfile_path, formatted_content)
        .map_err(|e| format!("Không thể ghi file tham số Java @argfile: {}", e))?;

    let child = SysCommand::new(&java_bin)
        .arg(format!("@{}", argfile_path.to_string_lossy()))
        .current_dir(&game_dir)
        .spawn()
        .map_err(|e| {
            format!(
                "Không thể mở tiến trình Java ('{}'): {}.\nVui lòng mở Tab Settings và bấm Auto-Detect hoặc chọn file java.exe thuộc JDK 21!",
                java_bin, e
            )
        })?;

    Ok(child.id())
}

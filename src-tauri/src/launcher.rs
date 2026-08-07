use std::process::Command as SysCommand;
use std::path::{Path, PathBuf};
use std::fs;
use std::collections::HashMap;
use crate::config::{AppConfig, detect_java_path};
use crate::auth::Account;

use serde::Deserialize;

#[derive(Deserialize)]
struct LibraryNameItem {
    name: Option<String>,
}

#[derive(Deserialize)]
struct VersionManifestJson {
    #[serde(rename = "mainClass")]
    main_class: Option<String>,
    libraries: Option<Vec<LibraryNameItem>>,
}

fn get_main_class_for_version(game_dir: &Path, version_id: &str) -> String {
    let json_path = game_dir.join("versions").join(version_id).join(format!("{}.json", version_id));
    if json_path.exists() {
        if let Ok(content) = fs::read_to_string(&json_path) {
            if let Ok(parsed) = serde_json::from_str::<VersionManifestJson>(&content) {
                if let Some(mc) = parsed.main_class {
                    if !mc.trim().is_empty() {
                        return mc;
                    }
                }
            }
        }
    }
    "net.minecraft.client.main.Main".to_string()
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

    let versions_to_check = vec![
        version_id.to_string(),
        version_id.split('-').next().unwrap_or(version_id).to_string(),
    ];

    // 1. Nạp tất cả libraries từ cả Mod Loader JSON lẫn Vanilla JSON
    for ver in versions_to_check {
        let json_path = game_dir.join("versions").join(&ver).join(format!("{}.json", ver));
        if json_path.exists() {
            if let Ok(content) = fs::read_to_string(&json_path) {
                if let Ok(parsed) = serde_json::from_str::<VersionManifestJson>(&content) {
                    if let Some(libs) = parsed.libraries {
                        for lib_item in libs {
                            if let Some(maven_name) = lib_item.name {
                                if let Some(rel_path) = maven_to_local_path(&maven_name) {
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

pub fn launch_game(
    version_id: &str,
    account: &Account,
    config: &AppConfig,
) -> Result<u32, String> {
    let game_dir = PathBuf::from(&config.game_dir);
    let assets_dir = game_dir.join("assets");
    
    // Tự động tìm Client Jar thích hợp
    let version_dir = game_dir.join("versions").join(version_id);
    let client_jar = version_dir.join(format!("{}.jar", version_id));

    // Fallback sang vanilla jar nếu bản mod loader chưa tạo jar riêng
    let actual_jar = if client_jar.exists() {
        client_jar
    } else {
        let vanilla_id = version_id.split('-').next().unwrap_or(version_id);
        game_dir.join("versions").join(vanilla_id).join(format!("{}.jar", vanilla_id))
    };

    if !actual_jar.exists() {
        return Err(format!(
            "Không tìm thấy file game jar tại: '{}'. Vui lòng bấm nút 'Tải về' trên giao diện!",
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

    // Thu thập danh sách Classpath chính xác 100% từ JSON Manifest của phiên bản game
    let mut jar_list = vec![actual_jar.to_string_lossy().to_string()];
    let version_libs = collect_libraries_for_version(&game_dir, version_id);
    jar_list.extend(version_libs);

    // Nạp bổ sung các thư viện cốt lõi cho Fabric/KnotClient nếu chưa có trong Profile JSON
    // Quét cụ thể từng thư viện riêng lẻ, KHÔNG quét toàn bộ net/fabricmc/ để tránh trùng fabric-loader.jar
    let extra_lib_dirs = vec![
        game_dir.join("libraries").join("org").join("ow2").join("asm"),
        game_dir.join("libraries").join("net").join("fabricmc").join("sponge-mixin"),
        game_dir.join("libraries").join("org").join("spongepowered"),
        game_dir.join("libraries").join("net").join("fabricmc").join("intermediary"),
    ];

    for dir in extra_lib_dirs {
        if dir.exists() {
            let mut extra_jars = Vec::new();
            collect_jars_recursive(&dir, &mut extra_jars);
            jar_list.extend(extra_jars);
        }
    }

    // Loại bỏ trùng lặp
    jar_list.sort();
    jar_list.dedup();

    // Debug: log classpath để phát hiện lỗi thiếu thư viện
    eprintln!("[MCLauncher DEBUG] Classpath entries ({} jars):", jar_list.len());
    for j in &jar_list {
        eprintln!("  CP: {}", j);
    }

    // Classpath construction
    let cp_separator = if cfg!(windows) { ";" } else { ":" };
    let classpath = jar_list.join(cp_separator);

    let mut args: Vec<String> = vec![
        min_ram_arg,
        max_ram_arg,
    ];

    if !config.jvm_args.trim().is_empty() {
        for arg in config.jvm_args.split_whitespace() {
            args.push(arg.to_string());
        }
    }

    let vanilla_version_str = version_id.split('-').next().unwrap_or(version_id);
    let main_class_to_run = get_main_class_for_version(&game_dir, version_id);
    let game_dir_to_use = if version_dir.exists() {
        version_dir.to_string_lossy().to_string()
    } else {
        game_dir.to_string_lossy().to_string()
    };

    args.extend(vec![
        "-cp".to_string(),
        classpath,
        main_class_to_run,
        "--username".to_string(),
        account.username.clone(),
        "--version".to_string(),
        vanilla_version_str.to_string(),
        "--gameDir".to_string(),
        game_dir_to_use,
        "--assetsDir".to_string(),
        assets_dir.to_string_lossy().to_string(),
        "--assetIndex".to_string(),
        vanilla_version_str.to_string(),
        "--uuid".to_string(),
        account.uuid.clone(),
        "--accessToken".to_string(),
        account.access_token.clone(),
        "--userType".to_string(),
        "mojang".to_string(),
        "--width".to_string(),
        config.resolution_width.to_string(),
        "--height".to_string(),
        config.resolution_height.to_string(),
    ]);

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

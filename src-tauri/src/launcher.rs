use std::process::Command as SysCommand;
use std::path::{Path, PathBuf};
use std::fs;
use crate::config::{AppConfig, detect_java_path};
use crate::auth::Account;

use std::collections::HashMap;

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

/// Thu thập và ưu tiên phiên bản thư viện mới nhất (loại bỏ các bản cũ trùng lặp như authlib 3.x gây lỗi NoSuchMethodError)
fn collect_and_filter_libraries(libraries_dir: &Path) -> Vec<String> {
    let mut raw_jars = Vec::new();
    collect_jars_recursive(libraries_dir, &mut raw_jars);

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
        // Sắp xếp phiên bản giảm dần (bản mới hơn đứng trước)
        paths.sort_by(|a, b| b.cmp(a));
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
    let libraries_dir = game_dir.join("libraries");
    
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

    // Thu thập và ưu tiên các thư viện JAR phiên bản mới nhất
    let mut jar_list = vec![actual_jar.to_string_lossy().to_string()];
    if libraries_dir.exists() {
        let filtered_libs = collect_and_filter_libraries(&libraries_dir);
        jar_list.extend(filtered_libs);
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

    args.extend(vec![
        "-cp".to_string(),
        classpath,
        "net.minecraft.client.main.Main".to_string(),
        "--username".to_string(),
        account.username.clone(),
        "--version".to_string(),
        version_id.to_string(),
        "--gameDir".to_string(),
        game_dir.to_string_lossy().to_string(),
        "--assetsDir".to_string(),
        assets_dir.to_string_lossy().to_string(),
        "--assetIndex".to_string(),
        version_id.to_string(),
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

use std::process::Command as SysCommand;
use std::path::PathBuf;
use crate::config::AppConfig;
use crate::auth::Account;

pub fn launch_game(
    version_id: &str,
    account: &Account,
    config: &AppConfig,
) -> Result<u32, String> {
    let game_dir = PathBuf::from(&config.game_dir);
    let assets_dir = game_dir.join("assets");
    let libraries_dir = game_dir.join("libraries");
    
    // Tự động tìm Client Jar thích hợp (Fabric hoặc Vanilla)
    let version_dir = game_dir.join("versions").join(version_id);
    let client_jar = version_dir.join(format!("{}.jar", version_id));

    // Fallback sang vanilla jar nếu bản mod loader chưa tạo jar riêng
    let actual_jar = if client_jar.exists() {
        client_jar
    } else {
        let vanilla_id = version_id.split('-').next().unwrap_or(version_id);
        game_dir.join("versions").join(vanilla_id).join(format!("{}.jar", vanilla_id))
    };

    let java_bin = if config.java_path.trim().is_empty() {
        "java".to_string()
    } else {
        config.java_path.clone()
    };

    let min_ram_arg = format!("-Xms{}M", config.min_ram_mb);
    let max_ram_arg = format!("-Xmx{}M", config.max_ram_mb);

    // Classpath construction
    let cp_separator = if cfg!(windows) { ";" } else { ":" };
    let classpath = format!(
        "{}{}{}",
        actual_jar.to_string_lossy(),
        cp_separator,
        libraries_dir.join("*").to_string_lossy()
    );

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

    let child = SysCommand::new(&java_bin)
        .args(&args)
        .current_dir(&game_dir)
        .spawn()
        .map_err(|e| {
            format!(
                "Không thể mở tiến trình Java ('{}'): {}.\nVui lòng đảm bảo máy bạn đã cài Java (JDK 17/21 cho Minecraft 1.17+) hoặc trỏ lại đường dẫn Java trong Settings!",
                java_bin, e
            )
        })?;

    Ok(child.id())
}

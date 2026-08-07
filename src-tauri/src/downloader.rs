use serde::{Deserialize, Serialize};
use std::fs::{self, File};
use std::io::Write;
use std::path::Path;
use sha1::{Digest, Sha1};
use tauri::Emitter;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DownloadProgressPayload {
    pub file_name: String,
    pub downloaded_bytes: u64,
    pub total_bytes: u64,
    pub percentage: f32,
    pub speed_mbps: f32,
    pub eta_seconds: u64,
    pub status: String,
}

pub async fn verify_and_download_file(
    url: &str,
    target_path: &Path,
    expected_sha1: Option<&str>,
) -> Result<(), String> {
    if let Some(parent) = target_path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    if target_path.exists() {
        if let Some(sha1_hash) = expected_sha1 {
            if check_file_sha1(target_path, sha1_hash) {
                return Ok(());
            }
        } else if fs::metadata(target_path).map(|m| m.len()).unwrap_or(0) > 5000 {
            return Ok(());
        }
    }

    let client = reqwest::Client::builder()
        .user_agent("MCLauncher/4.2.1")
        .build()
        .map_err(|e| e.to_string())?;

    let res = client.get(url).send().await.map_err(|e| e.to_string())?;
    let bytes = res.bytes().await.map_err(|e| e.to_string())?;

    let mut file = File::create(target_path).map_err(|e| e.to_string())?;
    file.write_all(&bytes).map_err(|e| e.to_string())?;

    Ok(())
}

pub async fn download_file_with_progress<R: tauri::Runtime>(
    app_handle: &tauri::AppHandle<R>,
    url: &str,
    target_path: &Path,
    file_name: &str,
) -> Result<(), String> {
    if let Some(parent) = target_path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    let part_path = target_path.with_extension("part");
    let existing_bytes = if part_path.exists() {
        fs::metadata(&part_path).map(|m| m.len()).unwrap_or(0)
    } else {
        0
    };

    let client = reqwest::Client::builder()
        .user_agent("MCLauncher/4.2.1")
        .build()
        .map_err(|e| e.to_string())?;

    let mut req = client.get(url);
    if existing_bytes > 0 {
        req = req.header(reqwest::header::RANGE, format!("bytes={}-", existing_bytes));
    }

    let mut res = req.send().await.map_err(|e| e.to_string())?;
    let status_code = res.status();

    let (is_append, mut downloaded_bytes, total_bytes) = if status_code == reqwest::StatusCode::PARTIAL_CONTENT {
        let content_range_total = res
            .headers()
            .get(reqwest::header::CONTENT_RANGE)
            .and_then(|v| v.to_str().ok())
            .and_then(|s| s.rsplit('/').next())
            .and_then(|s| s.parse::<u64>().ok())
            .unwrap_or(0);
        let total = if content_range_total > 0 { content_range_total } else { existing_bytes + res.content_length().unwrap_or(0) };
        (true, existing_bytes, total)
    } else {
        let total = res.content_length().unwrap_or(0);
        (false, 0, total)
    };

    let mut file = if is_append {
        fs::OpenOptions::new().write(true).append(true).open(&part_path).map_err(|e| e.to_string())?
    } else {
        File::create(&part_path).map_err(|e| e.to_string())?
    };

    let mut last_emit = std::time::Instant::now();
    let mut bytes_since_last_emit: u64 = 0;
    let mut current_speed_mbps: f32 = 0.0;

    while let Some(chunk) = res.chunk().await.map_err(|e| e.to_string())? {
        file.write_all(&chunk).map_err(|e| e.to_string())?;
        downloaded_bytes += chunk.len() as u64;
        bytes_since_last_emit += chunk.len() as u64;

        let elapsed_sec = last_emit.elapsed().as_secs_f32();
        if elapsed_sec >= 0.4 {
            current_speed_mbps = (bytes_since_last_emit as f32 / elapsed_sec) / (1024.0 * 1024.0);
            last_emit = std::time::Instant::now();
            bytes_since_last_emit = 0;
        }

        let percentage = if total_bytes > 0 {
            (downloaded_bytes as f32 / total_bytes as f32) * 100.0
        } else {
            0.0
        };

        let remaining_bytes = if total_bytes > downloaded_bytes { total_bytes - downloaded_bytes } else { 0 };
        let eta_seconds = if current_speed_mbps > 0.01 {
            (remaining_bytes as f32 / (current_speed_mbps * 1024.0 * 1024.0)) as u64
        } else {
            0
        };

        let _ = app_handle.emit(
            "download_progress",
            DownloadProgressPayload {
                file_name: file_name.to_string(),
                downloaded_bytes,
                total_bytes,
                percentage,
                speed_mbps: current_speed_mbps,
                eta_seconds,
                status: "downloading".to_string(),
            },
        );
    }

    drop(file);
    let _ = fs::rename(&part_path, target_path);

    // Gửi sự kiện hoàn thành
    let _ = app_handle.emit(
        "download_progress",
        DownloadProgressPayload {
            file_name: file_name.to_string(),
            downloaded_bytes: total_bytes,
            total_bytes,
            percentage: 100.0,
            speed_mbps: 0.0,
            eta_seconds: 0,
            status: "finished".to_string(),
        },
    );

    Ok(())
}

fn check_file_sha1(path: &Path, expected_sha1: &str) -> bool {
    if let Ok(mut file) = File::open(path) {
        let mut hasher = Sha1::new();
        if std::io::copy(&mut file, &mut hasher).is_ok() {
            let result = hasher.finalize();
            let hex = format!("{:x}", result);
            return hex.eq_ignore_ascii_case(expected_sha1);
        }
    }
    false
}

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
        } else {
            return Ok(());
        }
    }

    let client = reqwest::Client::new();
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

    let client = reqwest::Client::builder()
        .user_agent("MCLauncher/4.2.1")
        .build()
        .map_err(|e| e.to_string())?;

    let mut res = client.get(url).send().await.map_err(|e| e.to_string())?;
    let total_bytes = res.content_length().unwrap_or(0);

    let mut downloaded_bytes: u64 = 0;
    let mut file = File::create(target_path).map_err(|e| e.to_string())?;

    while let Some(chunk) = res.chunk().await.map_err(|e| e.to_string())? {
        file.write_all(&chunk).map_err(|e| e.to_string())?;
        downloaded_bytes += chunk.len() as u64;

        let percentage = if total_bytes > 0 {
            (downloaded_bytes as f32 / total_bytes as f32) * 100.0
        } else {
            0.0
        };

        let _ = app_handle.emit(
            "download_progress",
            DownloadProgressPayload {
                file_name: file_name.to_string(),
                downloaded_bytes,
                total_bytes,
                percentage,
                status: "downloading".to_string(),
            },
        );
    }

    // Gửi sự kiện hoàn thành
    let _ = app_handle.emit(
        "download_progress",
        DownloadProgressPayload {
            file_name: file_name.to_string(),
            downloaded_bytes,
            total_bytes,
            percentage: 100.0,
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

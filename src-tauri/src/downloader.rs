use serde::{Deserialize, Serialize};
use std::fs::{self, File};
use std::io::Write;
use std::path::{Path, PathBuf};
use sha1::{Digest, Sha1};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DownloadProgress {
    pub current_file: String,
    pub downloaded_files: u32,
    pub total_files: u32,
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

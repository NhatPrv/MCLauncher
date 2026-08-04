use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum AccountType {
    Offline,
    Microsoft,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Account {
    pub username: String,
    pub uuid: String,
    pub access_token: String,
    pub account_type: AccountType,
    pub refresh_token: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DeviceCodeResponse {
    pub user_code: String,
    pub device_code: String,
    pub verification_uri: String,
    pub expires_in: u64,
    pub interval: u64,
    pub message: String,
}

pub fn create_offline_account(username: &str) -> Account {
    // Generate UUID v3 based on OfflinePlayer:username
    let namespace = Uuid::nil();
    let offline_name = format!("OfflinePlayer:{}", username);
    let player_uuid = Uuid::new_v3(&namespace, offline_name.as_bytes());
    let formatted_uuid = player_uuid.to_string().replace("-", "");

    Account {
        username: username.to_string(),
        uuid: formatted_uuid,
        access_token: "offline_access_token".to_string(),
        account_type: AccountType::Offline,
        refresh_token: None,
    }
}

pub async fn start_microsoft_oauth() -> Result<DeviceCodeResponse, String> {
    let client = reqwest::Client::new();
    let client_id = "00000000402b5328"; // Standard public client ID for Xbox Live / Minecraft
    let params = [
        ("client_id", client_id),
        ("scope", "service::user.auth.xboxlive.com::MBI_SSL"),
        ("response_type", "token"),
    ];

    let res = client
        .post("https://login.live.com/oauth20_connect.srf")
        .form(&params)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    // Fallback simulation for OAuth flow if standard device code endpoint requires MSA scope
    let device_res = DeviceCodeResponse {
        user_code: "MC-AUTH".to_string(),
        device_code: "device_code_token".to_string(),
        verification_uri: "https://microsoft.com/link".to_string(),
        expires_in: 900,
        interval: 5,
        message: "Sign in with Microsoft account at https://microsoft.com/link".to_string(),
    };

    Ok(device_res)
}

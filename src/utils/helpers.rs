use sha2::{Sha256, Digest};
use sqlx::types::chrono::{DateTime, TimeZone};
use std::collections::HashMap;
use uuid::Uuid;
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};
use anyhow::Result;

pub fn calculate_hash(content: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(content.as_bytes());
    format!("{:x}", hasher.finalize())
}

pub fn sanitize_input(input: &str) -> String {
    ammonia::clean(input)
}

pub fn format_date<Tz: TimeZone>(date: DateTime<Tz>) -> String 
where
    Tz::Offset: std::fmt::Display,
{
    date.to_rfc3339()
}

pub fn truncate_text(text: &str, max_length: usize) -> String {
    if text.len() <= max_length {
        text.to_string()
    } else {
        let mut truncated = text.chars().take(max_length - 3).collect::<String>();
        truncated.push_str("...");
        truncated
    }
}

pub fn generate_id() -> String {
    Uuid::new_v4().to_string()
}

pub fn format_file_size(size: u64) -> String {
    const UNITS: [&str; 4] = ["B", "KB", "MB", "GB"];
    let mut size = size as f64;
    let mut unit_index = 0;

    while size >= 1024.0 && unit_index < UNITS.len() - 1 {
        size /= 1024.0;
        unit_index += 1;
    }

    format!("{:.2} {}", size, UNITS[unit_index])
}

// Remove PDF and HTML processing since we'll handle those in separate crates
pub async fn extract_text(content: &[u8], content_type: &str) -> Result<String> {
    match content_type {
        "text/plain" => Ok(String::from_utf8_lossy(content).to_string()),
        _ => Err(anyhow::anyhow!("Unsupported content type: {}", content_type))
    }
}

pub fn encode_base64(content: &[u8]) -> String {
    BASE64.encode(content)
}

pub fn decode_base64(content: &str) -> Result<Vec<u8>> {
    BASE64.decode(content)
        .map_err(|e| anyhow::anyhow!("Failed to decode base64: {}", e))
}
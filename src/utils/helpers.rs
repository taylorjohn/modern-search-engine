use sha2::{Sha256, Digest};
use uuid::Uuid;
use sqlx::types::chrono::{DateTime, TimeZone, Utc};
use ammonia;

pub fn calculate_hash(content: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(content.as_bytes());
    format!("{:x}", hasher.finalize())
}

pub fn generate_id() -> String {
    Uuid::new_v4().to_string()
}

/// Format date to RFC3339
pub fn format_date<Tz: TimeZone>(date: DateTime<Tz>) -> String 
where
    Tz::Offset: std::fmt::Display,
{
    date.to_rfc3339()
}

/// Truncate text to specified length with ellipsis
pub fn truncate_text(text: &str, max_length: usize) -> String {
    if text.len() <= max_length {
        text.to_string()
    } else {
        let mut truncated = text.chars().take(max_length - 3).collect::<String>();
        truncated.push_str("...");
        truncated
    }
}

/// Sanitize input text
pub fn sanitize_input(input: &str) -> String {
    ammonia::clean(input)
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

pub fn get_file_extension(filename: &str) -> Option<String> {
    std::path::Path::new(filename)
        .extension()
        .and_then(std::ffi::OsStr::to_str)
        .map(|s| s.to_lowercase())
}

pub fn is_valid_file_type(filename: &str, allowed_types: &[String]) -> bool {
    get_file_extension(filename)
        .map(|ext| allowed_types.contains(&ext))
        .unwrap_or(false)
}
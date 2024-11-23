use sha2::{Sha256, Digest};
use std::time::SystemTime;

pub fn calculate_hash(content: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(content.as_bytes());
    format!("{:x}", hasher.finalize())
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

/// Generate unique ID
pub fn generate_id() -> String {
    Uuid::new_v4().to_string()
}

/// Format file size
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

/// Extract file extension
pub fn get_file_extension(filename: &str) -> Option<String> {
    std::path::Path::new(filename)
        .extension()
        .and_then(std::ffi::OsStr::to_str)
        .map(|s| s.to_lowercase())
}

/// Validate file type
pub fn is_valid_file_type(filename: &str, allowed_types: &[String]) -> bool {
    get_file_extension(filename)
        .map(|ext| allowed_types.contains(&ext))
        .unwrap_or(false)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_hash() {
        let hash = calculate_hash("test content");
        assert_eq!(hash.len(), 64); // SHA-256 hash length
    }

    #[test]
    fn test_truncate_text() {
        let text = "This is a long text that needs to be truncated";
        let truncated = truncate_text(text, 20);
        assert_eq!(truncated, "This is a long te...");
    }

    #[test]
    fn test_format_file_size() {
        assert_eq!(format_file_size(1024), "1.00 KB");
        assert_eq!(format_file_size(1024 * 1024), "1.00 MB");
        assert_eq!(format_file_size(500), "500.00 B");
    }

    #[test]
    fn test_file_validation() {
        let allowed_types = vec!["pdf".to_string(), "txt".to_string()];
        assert!(is_valid_file_type("test.pdf", &allowed_types));
        assert!(!is_valid_file_type("test.doc", &allowed_types));
    }
}
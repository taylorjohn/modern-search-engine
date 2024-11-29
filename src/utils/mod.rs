use url::Url;
use std::fmt;

pub mod helpers;

pub use self::helpers::{
    calculate_hash,
    format_date,
    truncate_text,
    sanitize_input,
    generate_id,
};

#[derive(Debug, Clone)]
pub struct SafeUrl(Url);

impl SafeUrl {
    pub fn parse(input: &str) -> Result<Self, url::ParseError> {
        Ok(SafeUrl(Url::parse(input)?))
    }

    pub fn as_str(&self) -> &str {
        self.0.as_str()
    }
}

impl fmt::Display for SafeUrl {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}
// src/utils/url.rs
use std::fmt;
use anyhow::{Result, Context};
use thiserror::Error;
use reqwest::Url;

#[derive(Debug, Error)]
pub enum UrlError {
    #[error("Invalid URL scheme: expected http or https")]
    InvalidScheme,
    #[error("Invalid URL format: {0}")]
    InvalidFormat(String),
    #[error("URL host is required")]
    MissingHost,
    #[error("URL contains invalid characters")]
    InvalidCharacters,
    #[error("URL exceeds maximum length")]
    TooLong,
}

#[derive(Debug, Clone)]
pub struct SafeUrl {
    inner: Url,
}

impl SafeUrl {
    pub fn new(url: &str) -> Result<Self> {
        // Basic validation
        if url.len() > 2048 {
            return Err(UrlError::TooLong.into());
        }

        // Parse URL using reqwest's Url
        let url = Url::parse(url).context("Failed to parse URL")?;

        // Validate scheme
        if url.scheme() != "http" && url.scheme() != "https" {
            return Err(UrlError::InvalidScheme.into());
        }

        // Validate host
        if url.host_str().is_none() {
            return Err(UrlError::MissingHost.into());
        }

        Ok(Self { inner: url })
    }

    pub fn scheme(&self) -> &str {
        self.inner.scheme()
    }

    pub fn host(&self) -> Option<&str> {
        self.inner.host_str()
    }

    pub fn path(&self) -> &str {
        self.inner.path()
    }

    pub fn query(&self) -> Option<&str> {
        self.inner.query()
    }

    pub fn port(&self) -> Option<u16> {
        self.inner.port()
    }

    pub fn is_https(&self) -> bool {
        self.inner.scheme() == "https"
    }

    pub fn join(&self, path: &str) -> Result<Self> {
        let joined = self.inner.join(path)
            .context("Failed to join URL with path")?;
        Ok(Self { inner: joined })
    }

    pub fn as_str(&self) -> &str {
        self.inner.as_str()
    }
}

impl fmt::Display for SafeUrl {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.inner)
    }
}

impl TryFrom<&str> for SafeUrl {
    type Error = anyhow::Error;

    fn try_from(s: &str) -> Result<Self, Self::Error> {
        SafeUrl::new(s)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use pretty_assertions::assert_eq;

    #[test]
    fn test_valid_urls() {
        let cases = vec![
            "https://example.com",
            "http://localhost:8080",
            "https://api.example.com/v1/search?q=test",
        ];

        for url in cases {
            assert!(SafeUrl::new(url).is_ok(), "URL should be valid: {}", url);
        }
    }

    #[test]
    fn test_invalid_urls() {
        let cases = vec![
            "ftp://example.com",
            "not-a-url",
            "http://",
            format!("http://example.com/{}", "a".repeat(2049)),
        ];

        for url in cases {
            assert!(SafeUrl::new(&url).is_err(), "URL should be invalid: {}", url);
        }
    }

    #[test]
    fn test_url_components() {
        let url = SafeUrl::new("https://example.com:8080/path?query=test").unwrap();
        
        assert_eq!(url.scheme(), "https");
        assert_eq!(url.host(), Some("example.com"));
        assert_eq!(url.path(), "/path");
        assert_eq!(url.query(), Some("query=test"));
        assert_eq!(url.port(), Some(8080));
    }

    #[test]
    fn test_url_join() {
        let base = SafeUrl::new("https://example.com/api").unwrap();
        let joined = base.join("/v1/search").unwrap();
        
        assert_eq!(joined.to_string(), "https://example.com/api/v1/search");
    }
}
//! Modern Search Engine V2
//! 
//! A high-performance search engine with vector similarity search capabilities
//! and advanced document processing features.

pub mod api;
pub mod search;
pub mod document;
pub mod vector;
pub mod config;
pub mod telemetry;
pub mod utils;

use anyhow::Result;

/// Version information
pub const VERSION: &str = env!("CARGO_PKG_VERSION");
pub const MIN_SUPPORTED_VERSION: &str = "2.0.0";

/// Configuration for the search engine
#[derive(Debug, Clone)]
pub struct SearchEngineConfig {
    pub max_results: usize,
    pub min_score: f32,
    pub use_vector_search: bool,
    pub vector_weight: f32,
    pub text_weight: f32,
}

impl Default for SearchEngineConfig {
    fn default() -> Self {
        Self {
            max_results: 100,
            min_score: 0.1,
            use_vector_search: true,
            vector_weight: 0.6,
            text_weight: 0.4,
        }
    }
}

/// Initialize the search engine with default configuration
pub async fn init() -> Result<()> {
    init_with_config(SearchEngineConfig::default()).await
}

/// Initialize the search engine with custom configuration
pub async fn init_with_config(config: SearchEngineConfig) -> Result<()> {
    // Initialization code here
    Ok(())
}

// Public re-exports
pub use search::engine::SearchEngine;
pub use document::processor::DocumentProcessor;
pub use vector::store::VectorStore;

// Common types
pub mod prelude {
    pub use crate::search::types::{SearchResult, SearchOptions};
    pub use crate::document::types::{Document, DocumentMetadata};
    pub use crate::vector::types::VectorQuery;
    pub use crate::api::types::{ApiResponse, ApiError};
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_init() {
        assert!(init().await.is_ok());
    }

    #[tokio::test]
    async fn test_init_with_config() {
        let config = SearchEngineConfig {
            max_results: 50,
            min_score: 0.2,
            use_vector_search: true,
            vector_weight: 0.7,
            text_weight: 0.3,
        };
        assert!(init_with_config(config).await.is_ok());
    }
}

/// Feature gate for experimental features
#[cfg(feature = "experimental")]
pub mod experimental {
    //! Experimental features that are not yet stable
    
    pub mod semantic_search;
    pub mod query_understanding;
    pub mod auto_categorization;
}

/// Documentation examples
#[doc = include_str!("../README.md")]
pub struct Documentation;
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
pub use document::Document;  // Direct document type export
pub use document::DocumentMetadata;  // Direct metadata type export
pub use vector::store::VectorStore;
pub use search::types::SearchOptions;
pub use api::error::ApiError;

/// Common types prelude for convenient imports
pub mod prelude {
    pub use crate::search::types::{SearchResult, SearchOptions, SearchResponse};
    pub use crate::document::{Document, DocumentMetadata, DocumentUpload};
    pub use crate::vector::types::VectorQuery;
    pub use crate::api::error::{ApiError, ApiResponse};
    
    // Processing types
    pub use crate::document::processor::{ProcessingStatus, ProcessingTask};
    
    // Search configuration
    pub use crate::search::engine::SearchConfig;
    pub use crate::config::Settings;
    
    // Database types
    pub use sqlx::PgPool;
    pub use uuid::Uuid;
    
    // Common result type
    pub use anyhow::Result;
}

/// Query processing and analysis
pub mod query {
    pub use crate::search::query::{QueryParser, ParsedQuery};
    pub use crate::search::analysis::{analyze_query, QueryAnalysis};
}

/// Document processing and storage
pub mod processing {
    pub use crate::document::processor::{
        DocumentProcessor, ProcessingStatus, ProcessingTask,
        DocumentTypeProcessor, ProcessingResult,
    };
    pub use crate::document::store::DocumentStore;
}

/// Vector operations and similarity search
pub mod vectors {
    pub use crate::vector::store::VectorStore;
    pub use crate::vector::embeddings::{EmbeddingGenerator, EmbeddingModel};
    pub use crate::vector::types::{VectorQuery, VectorSearchResult};
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
    
    #[test]
    fn test_config_defaults() {
        let config = SearchEngineConfig::default();
        assert_eq!(config.max_results, 100);
        assert_eq!(config.min_score, 0.1);
        assert!(config.use_vector_search);
        assert_eq!(config.vector_weight, 0.6);
        assert_eq!(config.text_weight, 0.4);
    }
}

/// Feature gate for experimental features
#[cfg(feature = "experimental")]
pub mod experimental {
    //! Experimental features that are not yet stable
    
    pub use crate::search::semantic::SemanticSearch;
    pub use crate::search::understanding::QueryUnderstanding;
    pub use crate::document::categorization::AutoCategorization;
}

/// Documentation examples
#[doc = include_str!("../README.md")]
pub struct Documentation;
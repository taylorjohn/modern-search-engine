//! Modern Search Engine V2

mod api;
mod config;
mod document;
mod search;
mod utils;
mod vector;

use anyhow::Result;

/// Version information
pub const VERSION: &str = env!("CARGO_PKG_VERSION");
pub const MIN_SUPPORTED_VERSION: &str = "2.0.0";

// Public re-exports
pub use self::api::error::ApiError;
pub use self::config::SearchConfig;
pub use self::document::{Document, DocumentMetadata, DocumentUpload, ProcessingStatus};
pub use self::document::processor::DocumentProcessor;
pub use self::search::types::{SearchResult, SearchResponse};
pub use self::vector::store::VectorStore;

/// Common types prelude for convenient imports
pub mod prelude {
    pub use crate::{
        Document,
        DocumentMetadata,
        DocumentUpload,
        ProcessingStatus,
        DocumentProcessor,
        SearchResult,
        SearchResponse,
        SearchConfig,
        VectorStore,
        ApiError,
    };

    // Database types
    pub use sqlx::PgPool;
    pub use uuid::Uuid;
    
    // Common result type
    pub use anyhow::Result;
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_init() {
        // TODO: Implement test
    }
}
pub mod api;
pub mod config;
pub mod document;
pub mod search;
pub mod telemetry;
pub mod utils;
pub mod vector;

pub use document::{Document, DocumentMetadata, DocumentUpload};
pub use search::{SearchConfig, SearchEngine, SearchResult};
pub use vector::{VectorDocument, VectorStore, EmbeddingGenerator};

use anyhow::Result;

pub async fn setup() -> Result<(SearchEngine, DocumentProcessor)> {
    todo!("Implement setup")
}

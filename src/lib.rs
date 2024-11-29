pub mod api;
pub mod config;
pub mod document;
pub mod search;
pub mod telemetry;
pub mod utils;
pub mod vector;

pub use document::{Document, DocumentMetadata, DocumentUpload, ProcessingStatus};
pub use search::{SearchConfig, SearchEngine, SearchResult};
pub use vector::{VectorDocument, VectorStore, VectorSearchResult};

// Make modules public
pub use self::api::ApiError;
pub use self::document::DocumentProcessor;
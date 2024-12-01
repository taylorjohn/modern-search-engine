use serde::{Serialize, Deserialize};
use chrono::{DateTime, Utc};
use std::collections::HashMap;

pub mod types;
pub mod processor;
pub mod store;

pub use self::types::{Document, DocumentMetadata, DocumentUpload};
pub use self::processor::DocumentProcessor;
pub use self::store::DocumentStore;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ProcessingStatus {
    Pending,
    Processing(f32),
    Completed(String),
    Failed(String),
}
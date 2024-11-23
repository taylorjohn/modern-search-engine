pub mod types;
pub mod processor;
pub mod store;

pub use self::types::*;
pub use self::store::DocumentStore;
pub use self::processor::DocumentProcessor;


use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Document {
    pub id: String,
    pub title: String,
    pub content: String,
    pub content_type: String,
    pub metadata: DocumentMetadata,
    pub vector_embedding: Option<Vec<f32>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentMetadata {
    pub source_type: String,
    pub author: Option<String>,
    pub created_at: chrono::DateTime<Utc>,
    pub last_modified: chrono::DateTime<Utc>,
    pub language: Option<String>,
    pub tags: Vec<String>,
    pub custom_metadata: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ProcessingStatus {
    Pending,
    Processing(f32),  // Progress percentage
    Completed(String),  // Document ID
    Failed(String),   // Error message
}
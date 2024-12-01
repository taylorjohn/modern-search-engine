pub mod processor;
pub mod store;
pub mod types;

pub use self::types::*;
pub use self::processor::DocumentProcessor;
pub use self::store::DocumentStore;

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
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentMetadata {
    pub source_type: String,
    pub author: Option<String>,
    pub language: Option<String>,
    pub tags: Vec<String>,
    pub custom_metadata: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DocumentUpload {
    #[serde(rename = "pdf")]
    Pdf {
        base64_content: String,
        filename: String,
        metadata: Option<HashMap<String, String>>,
    },
    #[serde(rename = "html")]
    Html {
        content: String,
        url: Option<String>,
        metadata: Option<HashMap<String, String>>,
    },
    #[serde(rename = "text")]
    Text {
        content: String,
        title: String,
        metadata: Option<HashMap<String, String>>,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ProcessingStatus {
    Pending,
    Processing(f32),
    Completed(String),
    Failed(String),
}

impl Default for DocumentMetadata {
    fn default() -> Self {
        Self {
            source_type: "unknown".to_string(),
            author: None,
            language: None,
            tags: Vec::new(),
            custom_metadata: HashMap::new(),
        }
    }
}

impl Document {
    pub fn new(
        title: String,
        content: String,
        content_type: String,
        metadata: DocumentMetadata,
        vector_embedding: Option<Vec<f32>>,
    ) -> Self {
        Self {
            id: crate::utils::helpers::generate_id(),
            title,
            content,
            content_type,
            metadata,
            vector_embedding,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        }
    }
}
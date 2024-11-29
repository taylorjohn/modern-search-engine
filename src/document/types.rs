use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use chrono::{DateTime, Utc};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Document {
    pub id: Uuid,
    pub title: String,
    pub content: String,
    pub content_type: String,
    pub vector_embedding: Option<Vec<f32>>,
    pub metadata: DocumentMetadata,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct DocumentMetadata {
    pub source_type: String,
    pub author: Option<String>,
    pub language: Option<String>,
    pub tags: Vec<String>,
    pub custom_metadata: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ProcessingStatus {
    Pending,
    Processing(f32),
    Completed(String),
    Failed(String),
}

#[derive(Debug, Deserialize)]
pub enum DocumentUpload {
    Pdf {
        base64_content: String,
        filename: String,
        metadata: Option<HashMap<String, String>>,
    },
    Html {
        content: String,
        url: Option<String>,
        metadata: Option<HashMap<String, String>>,
    },
    Text {
        content: String,
        title: String,
        metadata: Option<HashMap<String, String>>,
    },
}
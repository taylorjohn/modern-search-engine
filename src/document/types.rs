// src/document/types.rs
use serde::{Serialize, Deserialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Document {
    pub id: Uuid,
    pub title: String,
    pub content: String,
    pub content_type: String,
    pub metadata: serde_json::Value,
    pub vector_embedding: Option<Vec<f32>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ProcessingStatus {
    Pending,
    Processing(f32),
    Completed(Uuid),
    Failed(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessingTask {
    pub id: Uuid,
    pub document_id: Uuid,
    pub status: ProcessingStatus,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
#[serde(tag = "type", content = "content")]
pub enum DocumentUpload {
    Text {
        content: String,
        title: Option<String>,
        metadata: Option<serde_json::Value>,
    },
    Html {
        content: String,
        url: Option<String>,
        metadata: Option<serde_json::Value>,
    },
    Pdf {
        base64: String,
        filename: String,
        metadata: Option<serde_json::Value>,
    },
}
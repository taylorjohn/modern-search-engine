// src/document/types.rs
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

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct DocumentMetadata {
    pub source_type: String,
    pub author: Option<String>,
    pub language: Option<String>,
    pub tags: Vec<String>,
    pub custom_metadata: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "content")]
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

impl Document {
    pub fn new(
        title: String,
        content: String,
        content_type: String,
        metadata: DocumentMetadata,
        vector_embedding: Option<Vec<f32>>,
    ) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
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
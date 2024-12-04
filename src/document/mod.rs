mod processor;
mod store;

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
    pub scores: DocumentScores,
    pub highlights: Vec<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct DocumentMetadata {
    pub source_type: String,
    pub author: Option<String>,
    pub language: Option<String>,
    pub word_count: usize,
    pub tags: Vec<String>,
    pub custom_metadata: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentScores {
    pub text_score: f32,
    pub vector_score: f32,
    pub final_score: f32,
}

impl Default for DocumentScores {
    fn default() -> Self {
        Self {
            text_score: 0.0,
            vector_score: 0.0,
            final_score: 0.0,
        }
    }
}

#[derive(Debug, Deserialize)]
pub enum DocumentUpload {
    #[serde(rename = "pdf")]
    Pdf {
        content: String,
        title: String,
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

pub use processor::DocumentProcessor;
pub use store::DocumentStore;
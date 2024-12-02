use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use chrono::{DateTime, Utc};

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
    pub scores: DocumentScores,
    pub highlights: Vec<String>,
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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentMetadata {
    pub source_type: String,
    pub author: Option<String>,
    pub language: Option<String>,
    pub tags: Vec<String>,
    pub custom_metadata: HashMap<String, String>,
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

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum DocumentUpload {
    #[serde(rename = "text")]
    Text {
        content: String,
        title: String,
        metadata: Option<HashMap<String, serde_json::Value>>,
    },
    #[serde(rename = "pdf")]
    Pdf {
        base64_content: String,
        filename: String,
        metadata: Option<HashMap<String, serde_json::Value>>,
    },
    #[serde(rename = "html")]
    Html {
        content: String,
        url: Option<String>,
        metadata: Option<HashMap<String, serde_json::Value>>,
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
            scores: DocumentScores::default(),
            highlights: Vec::new(),
        }
    }
}
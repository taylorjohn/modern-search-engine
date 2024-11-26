use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use std::collections::HashMap;
use uuid::Uuid;
use thiserror::Error;

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
    pub created_at: DateTime<Utc>,
    pub last_modified: DateTime<Utc>,
    pub language: Option<String>,
    pub tags: Vec<String>,
    pub custom_metadata: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ProcessingStatus {
    Pending,
    Processing(f32),  // Progress percentage
    Completed(String),  // Document ID
    Failed(String),   // Error message
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentStats {
    pub total_documents: i64,
    pub total_size: i64,
    pub by_type: HashMap<String, i64>,
}

#[derive(Error, Debug)]
pub enum DocumentError {
    #[error("Document not found: {0}")]
    NotFound(String),

    #[error("Processing failed: {0}")]
    ProcessingFailed(String),

    #[error("Invalid document data: {0}")]
    InvalidData(String),

    #[error("Database error: {0}")]
    DatabaseError(#[from] sqlx::Error),

    #[error("Internal error: {0}")]
    Internal(String),
}

impl Default for DocumentMetadata {
    fn default() -> Self {
        Self {
            source_type: "unknown".to_string(),
            author: None,
            created_at: Utc::now(),
            last_modified: Utc::now(),
            language: None,
            tags: Vec::new(),
            custom_metadata: HashMap::new(),
        }
    }
}

impl Document {
    pub fn new(title: String, content: String, content_type: String) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            title,
            content,
            content_type,
            metadata: DocumentMetadata::default(),
            vector_embedding: None,
        }
    }

    pub fn with_metadata(mut self, metadata: DocumentMetadata) -> Self {
        self.metadata = metadata;
        self
    }

    pub fn with_embedding(mut self, embedding: Vec<f32>) -> Self {
        self.vector_embedding = Some(embedding);
        self
    }

    pub fn word_count(&self) -> usize {
        self.content.split_whitespace().count()
    }

    pub fn content_size(&self) -> usize {
        self.content.len()
    }
    
    pub fn update_modified(&mut self) {
        self.metadata.last_modified = Utc::now();
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DocumentUpload {
    pub title: Option<String>,
    pub content: String,
    pub content_type: String,
    pub metadata: Option<HashMap<String, String>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DocumentBatch {
    pub documents: Vec<DocumentUpload>,
    pub batch_metadata: Option<HashMap<String, String>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BatchProcessingStatus {
    pub batch_id: String,
    pub total: usize,
    pub completed: usize,
    pub failed: usize,
    pub in_progress: usize,
    pub statuses: HashMap<String, ProcessingStatus>,
}

impl BatchProcessingStatus {
    pub fn new(batch_id: String, total: usize) -> Self {
        Self {
            batch_id,
            total,
            completed: 0,
            failed: 0,
            in_progress: 0,
            statuses: HashMap::new(),
        }
    }

    pub fn progress_percentage(&self) -> f32 {
        if self.total == 0 {
            return 0.0;
        }
        (self.completed as f32 / self.total as f32) * 100.0
    }
}
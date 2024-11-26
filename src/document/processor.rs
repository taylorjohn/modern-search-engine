// src/document/processor.rs

use crate::vector::store::VectorStore;
use crate::document::{Document, DocumentMetadata, ProcessingStatus};
use anyhow::Result;
use std::sync::Arc;
use tokio::sync::RwLock;
use std::collections::HashMap;
use uuid::Uuid;
use chrono::Utc;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct DocumentUpload {
    pub content: String,
    pub title: Option<String>,
    pub content_type: String,
    pub metadata: Option<HashMap<String, String>>,
}

pub struct DocumentProcessor {
    vector_store: Arc<RwLock<VectorStore>>,
    processing_queue: Arc<RwLock<HashMap<String, ProcessingStatus>>>,
}

impl DocumentProcessor {
    pub fn new(vector_store: Arc<RwLock<VectorStore>>) -> Self {
        Self {
            vector_store,
            processing_queue: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub async fn process_document(&self, upload: DocumentUpload) -> Result<Document> {
        let vector_store = self.vector_store.read().await;
        
        // Generate vector embedding
        let vector_embedding = vector_store.generate_embedding(&upload.content).await?;
        
        // Create document
        let document = Document {
            id: Uuid::new_v4().to_string(),
            title: upload.title.unwrap_or_else(|| "Untitled".to_string()),
            content: upload.content,
            content_type: upload.content_type,
            vector_embedding: Some(vector_embedding),
            metadata: DocumentMetadata {
                source_type: "upload".to_string(),
                content_type: Some(upload.content_type.clone()),
                author: upload.metadata.as_ref().and_then(|m| m.get("author").cloned()),
                created_at: Utc::now(),
                last_modified: Some(Utc::now()),
                word_count: 0, // Will be computed later
                language: None,
                tags: Vec::new(),
                custom_metadata: upload.metadata.unwrap_or_default(),
            },
        };

        // Store document
        let mut vector_store = self.vector_store.write().await;
        vector_store.add_document(&document).await?;

        Ok(document)
    }

    pub async fn get_processing_status(&self, processing_id: &str) -> Result<ProcessingStatus> {
        let queue = self.processing_queue.read().await;
        queue.get(processing_id)
            .cloned()
            .ok_or_else(|| anyhow::anyhow!("Processing task not found"))
    }

    pub async fn cleanup_old_tasks(&self, _hours: i64) -> Result<()> {
        let mut queue = self.processing_queue.write().await;
        queue.retain(|_, status| {
            matches!(status, ProcessingStatus::Processing(_) | ProcessingStatus::Pending)
        });
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_document_processing() {
        // TODO: Implement tests
    }
}
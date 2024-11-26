use crate::vector::store::VectorStore;
use crate::document::{Document, DocumentMetadata, ProcessingStatus};
use anyhow::{Result, Context};
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
        let processing_id = Uuid::new_v4().to_string();
        
        // Update queue status
        {
            let mut queue = self.processing_queue.write().await;
            queue.insert(processing_id.clone(), ProcessingStatus::Processing(0.0));
        }

        // Generate vector embedding
        let vector_store = self.vector_store.read().await;
        let vector_embedding = vector_store.generate_embedding(&upload.content)
            .await
            .context("Failed to generate vector embedding")?;

        // Calculate word count
        let word_count = upload.content.split_whitespace().count();
        
        // Create document
        let document = Document {
            id: Uuid::new_v4().to_string(),
            title: upload.title.unwrap_or_else(|| "Untitled".to_string()),
            content: upload.content,
            content_type: upload.content_type,
            vector_embedding: Some(vector_embedding),
            metadata: DocumentMetadata {
                source_type: "upload".to_string(),
                author: upload.metadata.as_ref().and_then(|m| m.get("author").cloned()),
                created_at: Utc::now(),
                last_modified: Utc::now(),
                language: None,
                tags: Vec::new(),
                custom_metadata: upload.metadata.unwrap_or_default(),
            },
        };

        // Update processing status
        {
            let mut queue = self.processing_queue.write().await;
            queue.insert(processing_id.clone(), ProcessingStatus::Completed(document.id.clone()));
        }

        Ok(document)
    }

    pub async fn get_processing_status(&self, processing_id: &str) -> Result<ProcessingStatus> {
        let queue = self.processing_queue.read().await;
        queue.get(processing_id)
            .cloned()
            .context("Processing task not found")
    }

    pub async fn cleanup_old_tasks(&self, hours: i64) -> Result<()> {
        let mut queue = self.processing_queue.write().await;
        let cutoff = Utc::now() - chrono::Duration::hours(hours);
        
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
        // Create test vector store
        let vector_store = Arc::new(RwLock::new(
            VectorStore::new().await.expect("Failed to create vector store")
        ));

        // Create processor
        let processor = DocumentProcessor::new(vector_store);

        // Create test upload
        let upload = DocumentUpload {
            content: "Test content".to_string(),
            title: Some("Test Document".to_string()),
            content_type: "text/plain".to_string(),
            metadata: Some(HashMap::new()),
        };

        // Process document
        let result = processor.process_document(upload).await;
        assert!(result.is_ok());

        let doc = result.unwrap();
        assert!(doc.vector_embedding.is_some());
        assert_eq!(doc.title, "Test Document");
        assert_eq!(doc.content_type, "text/plain");
    }
}
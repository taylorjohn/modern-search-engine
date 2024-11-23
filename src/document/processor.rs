use crate::utils::url::SafeUrl;
use crate::vector::store::VectorStore;
use crate::document::{Document, DocumentMetadata, Deserialize, HashMap, Serialize, ProcessingStatus};
use anyhow::Result;
use std::sync::Arc;
use tokio::sync::RwLock;
use uuid::Uuid;
use chrono::Utc;

pub struct DocumentProcessor {
    vector_store: Arc<RwLock<VectorStore>>,
    processing_queue: Arc<RwLock<HashMap<String, ProcessingStatus>>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DocumentUpload {
    pub content: String,
    pub title: Option<String>,
    pub content_type: String,
    pub metadata: Option<HashMap<String, String>>,
}

impl DocumentProcessor {
    pub fn new(vector_store: Arc<RwLock<VectorStore>>) -> Self {
        Self {
            vector_store,
            processing_queue: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub async fn process_document(&self, upload: DocumentUpload) -> Result<String> {
        let processing_id = Uuid::new_v4().to_string();
        
        // Add to processing queue
        {
            let mut queue = self.processing_queue.write().await;
            queue.insert(processing_id.clone(), ProcessingStatus::Pending);
        }

        // Clone necessary components for async processing
        let vector_store = self.vector_store.clone();
        let processing_queue = self.processing_queue.clone();
        let processing_id_clone = processing_id.clone();

        // Spawn processing task
        tokio::spawn(async move {
            let result = async {
                // Update status to processing
                {
                    let mut queue = processing_queue.write().await;
                    queue.insert(processing_id_clone.clone(), ProcessingStatus::Processing(0.0));
                }

                // Generate vector embedding
                let vector_store = vector_store.read().await;
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
                        author: upload.metadata.as_ref().and_then(|m| m.get("author").cloned()),
                        created_at: Utc::now(),
                        last_modified: Utc::now(),
                        language: None, // TODO: Implement language detection
                        tags: Vec::new(),
                        custom_metadata: upload.metadata.unwrap_or_default(),
                    },
                };

                // Store document
                let mut vector_store = vector_store.write().await;
                vector_store.add_document(&document).await?;

                // Update status to completed
                {
                    let mut queue = processing_queue.write().await;
                    queue.insert(
                        processing_id_clone.clone(),
                        ProcessingStatus::Completed(document.id.clone()),
                    );
                }

                Ok::<_, anyhow::Error>(())
            }.await;

            if let Err(e) = result {
                let mut queue = processing_queue.write().await;
                queue.insert(
                    processing_id_clone,
                    ProcessingStatus::Failed(e.to_string()),
                );
            }
        });

        Ok(processing_id)
    }

    pub async fn get_processing_status(&self, processing_id: &str) -> Result<ProcessingStatus> {
        let queue = self.processing_queue.read().await;
        queue.get(processing_id)
            .cloned()
            .ok_or_else(|| anyhow::anyhow!("Processing task not found"))
    }

    pub async fn cleanup_old_tasks(&self, hours: i64) -> Result<()> {
        let now = Utc::now();
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
// src/document/processor.rs
use crate::vector::store::VectorStore;
use crate::search::engine::SearchEngine;
use crate::document::{Document, DocumentMetadata, ProcessingStatus, DocumentUpload};
use anyhow::Result;
use std::sync::Arc;
use tokio::sync::RwLock;
use std::collections::HashMap;
use uuid::Uuid;

pub struct DocumentProcessor {
    vector_store: Arc<RwLock<VectorStore>>,
    search_engine: Arc<SearchEngine>,
    processing_queue: Arc<RwLock<HashMap<Uuid, ProcessingStatus>>>,
}

impl DocumentProcessor {
    pub fn new(
        vector_store: Arc<RwLock<VectorStore>>,
        search_engine: Arc<SearchEngine>,
    ) -> Self {
        Self {
            vector_store,
            search_engine,
            processing_queue: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub async fn process_document(&self, upload: DocumentUpload) -> Result<Uuid> {
        let processing_id = Uuid::new_v4();
        
        {
            let mut queue = self.processing_queue.write().await;
            queue.insert(processing_id, ProcessingStatus::Processing(0.0));
        }

        // Do processing
        let store = self.vector_store.read().await;
        let doc_id = match upload {
            DocumentUpload::Text { content, title, metadata } => {
                let embedding = store.generate_embedding(&content).await?;
                // Store document
                store.add_document(
                    title.unwrap_or_else(|| "Untitled".to_string()), 
                    &content,
                    "text",
                    metadata.unwrap_or_default()
                ).await?
            }
            // Handle other types...
            _ => return Err(anyhow::anyhow!("Unsupported document type"))
        };

        {
            let mut queue = self.processing_queue.write().await;
            queue.insert(processing_id, ProcessingStatus::Completed(doc_id));
        }

        Ok(doc_id)
    }

    pub async fn get_processing_status(&self, id: Uuid) -> Result<ProcessingStatus> {
        let queue = self.processing_queue.read().await;
        queue.get(&id)
            .cloned()
            .ok_or_else(|| anyhow::anyhow!("Processing task not found"))
    }
}
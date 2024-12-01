use crate::vector::store::VectorStore;
use crate::document::{Document, DocumentUpload, DocumentMetadata};
use anyhow::Result;
use std::sync::Arc;
use tokio::sync::RwLock;

pub struct DocumentProcessor {
    vector_store: Arc<RwLock<VectorStore>>,
}

impl DocumentProcessor {
    pub fn new(vector_store: Arc<RwLock<VectorStore>>) -> Self {
        Self { vector_store }
    }

    pub async fn process_document(&self, upload: DocumentUpload) -> Result<String> {
        let doc = match upload {
            DocumentUpload::Text { content, title, metadata: _ } => {
                Document::new(
                    title,
                    content,
                    "text".to_string(),
                    DocumentMetadata::default(),
                    None,
                )
            },
            _ => todo!("Implement other document types")
        };

        let mut vector_store = self.vector_store.write().await;
        vector_store.add_document(&doc).await?;

        Ok(doc.id)
    }

    pub async fn get_processing_status(&self, _id: &str) -> Result<String> {
        Ok("Processing".to_string())
    }
}
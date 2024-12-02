use crate::vector::store::VectorStore;
use crate::document::{Document, DocumentUpload, DocumentMetadata};
use anyhow::Result;
use std::sync::Arc;
use tokio::sync::RwLock;
use chrono::Utc;

pub struct DocumentProcessor {
    vector_store: Arc<RwLock<VectorStore>>,
}

impl DocumentProcessor {
    pub fn new(vector_store: Arc<RwLock<VectorStore>>) -> Self {
        Self { vector_store }
    }

    pub async fn process_document(&self, upload: DocumentUpload) -> Result<String> {
        let (content, title, metadata) = match upload {
            DocumentUpload::Text { content, title, metadata } => {
                let metadata = metadata.unwrap_or_default();
                (content, title, metadata)
            },
            DocumentUpload::Html { content, url: _, metadata } => {
                let metadata = metadata.unwrap_or_default();
                (content, "HTML Document".to_string(), metadata)
            },
            DocumentUpload::Pdf { base64_content: _, filename, metadata } => {
                let metadata = metadata.unwrap_or_default();
                ("PDF Content".to_string(), filename, metadata) // Placeholder for PDF processing
            },
        };

        let doc = Document {
            id: uuid::Uuid::new_v4().to_string(),
            title,
            content,
            content_type: "text".to_string(),
            metadata: DocumentMetadata {
                source_type: "upload".to_string(),
                author: metadata.get("author").and_then(|v| v.as_str().map(|s| s.to_string())),
                language: None,
                tags: vec![],
                custom_metadata: Default::default(),
            },
            vector_embedding: Some(vec![0.1; 384]), // Placeholder embedding
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        let mut vector_store = self.vector_store.write().await;
        vector_store.add_document(&doc).await?;

        Ok(doc.id)
    }
}
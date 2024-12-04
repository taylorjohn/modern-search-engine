use crate::document::types::{Document, DocumentMetadata, DocumentScores, DocumentUpload};
use crate::vector::VectorStore;
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

    pub async fn process_document(&self, upload: DocumentUpload) -> Result<Document> {
        let (content, title, metadata) = match upload {
            DocumentUpload::Pdf { content, title, metadata } => {
                (content, title, metadata)
            },
            DocumentUpload::Html { content, url, metadata } => {
                (content, url.unwrap_or_else(|| "Untitled".to_string()), metadata)
            },
            DocumentUpload::Text { content, title, metadata } => {
                (content, title, metadata)
            }
        };

        let doc = Document {
            id: uuid::Uuid::new_v4().to_string(),
            title,
            content,
            content_type: "text/plain".to_string(),
            metadata: DocumentMetadata {
                source_type: "upload".to_string(),
                author: None,
                language: None,
                word_count: content.split_whitespace().count(),
                tags: Vec::new(),
                custom_metadata: metadata.unwrap_or_default(),
            },
            vector_embedding: None,
            scores: DocumentScores::default(),
            highlights: Vec::new(),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        // Generate vector embedding
        let vector_store = self.vector_store.read().await;
        match vector_store.add_document(&doc).await {
            Ok(_) => Ok(doc),
            Err(e) => Err(e),
        }
    }
}
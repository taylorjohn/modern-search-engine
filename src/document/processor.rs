use anyhow::Result;
use std::sync::Arc;
use tokio::sync::RwLock;
use chrono::Utc;
use crate::vector::VectorStore;
use crate::document::{Document, DocumentMetadata, DocumentUpload};

pub struct DocumentProcessor {
    vector_store: Arc<RwLock<VectorStore>>,
}

impl DocumentProcessor {
    pub fn new(vector_store: Arc<RwLock<VectorStore>>) -> Self {
        Self { vector_store }
    }

    pub async fn process_document(&self, upload: DocumentUpload) -> Result<String> {
        let document = match upload {
            DocumentUpload::Text { content, title, metadata } => Document {
                id: uuid::Uuid::new_v4(),
                title,
                content,
                content_type: "text".to_string(),
                vector_embedding: None,
                metadata: DocumentMetadata::new(metadata, "text"),
                created_at: Utc::now(),
                updated_at: Utc::now(),
            },
            DocumentUpload::Html { content, url, metadata } => Document {
                id: uuid::Uuid::new_v4(),
                title: url.unwrap_or_else(|| "Untitled".to_string()),
                content,
                content_type: "html".to_string(),
                vector_embedding: None,
                metadata: DocumentMetadata::new(metadata, "html"),
                created_at: Utc::now(),
                updated_at: Utc::now(),
            },
            DocumentUpload::Pdf { base64_content, filename, metadata } => Document {
                id: uuid::Uuid::new_v4(),
                title: filename,
                content: String::from_utf8(base64::decode(base64_content)?)?,
                content_type: "pdf".to_string(),
                vector_embedding: None,
                metadata: DocumentMetadata::new(metadata, "pdf"),
                created_at: Utc::now(),
                updated_at: Utc::now(),
            },
        };

        let vector_store = self.vector_store.write().await;
        let vec_doc = (&document).into();
        vector_store.add_document(&vec_doc).await?;
        Ok(document.id.to_string())
    }
}

impl DocumentMetadata {
    fn new(metadata: Option<std::collections::HashMap<String, String>>, source_type: &str) -> Self {
        Self {
            source_type: source_type.to_string(),
            author: metadata.as_ref().and_then(|m| m.get("author").cloned()),
            language: None,
            tags: vec![],
            custom_metadata: metadata.unwrap_or_default(),
        }
    }
}
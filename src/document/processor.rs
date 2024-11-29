use anyhow::Result;
use std::sync::Arc;
use tokio::sync::RwLock;
use chrono::Utc;
use uuid::Uuid;
use crate::document::{Document, DocumentMetadata, DocumentUpload};
use crate::vector::VectorStore;

pub struct DocumentProcessor {
    vector_store: Arc<RwLock<VectorStore>>,
}

impl DocumentProcessor {
    pub fn new(vector_store: Arc<RwLock<VectorStore>>) -> Self {
        Self { vector_store }
    }

    pub async fn process_document(&self, upload: DocumentUpload) -> Result<Uuid> {
        let (content, title, content_type, metadata) = match upload {
            DocumentUpload::Text { content, title, metadata } => {
                (content, title, "text".to_string(), metadata)
            },
            DocumentUpload::Html { content, url, metadata } => {
                (content, url.unwrap_or_else(|| "Untitled".to_string()), 
                 "html".to_string(), metadata)
            },
            DocumentUpload::Pdf { base64_content, filename, metadata } => {
                let content = base64::Engine::decode(
                    &base64::engine::general_purpose::STANDARD, 
                    base64_content
                )?;
                let text = String::from_utf8(content)?;
                (text, filename, "pdf".to_string(), metadata)
            }
        };

        let now = Utc::now();
        let document = Document {
            id: Uuid::new_v4(),
            title,
            content,
            content_type,
            vector_embedding: None,
            metadata: DocumentMetadata {
                source_type: "upload".to_string(),
                author: metadata.as_ref().and_then(|m| m.get("author").cloned()),
                language: None,
                tags: vec![],
                custom_metadata: metadata.unwrap_or_default(),
            },
            created_at: now,
            updated_at: now,
        };

        let vector_store = self.vector_store.write().await;
        vector_store.add_document(&document.into()).await?;

        Ok(document.id)
    }
}

impl From<&Document> for crate::vector::VectorDocument {
    fn from(doc: &Document) -> Self {
        Self {
            id: doc.id,
            vector: doc.vector_embedding.clone().unwrap_or_default(),
            metadata: crate::vector::VectorMetadata {
                title: doc.title.clone(),
                content_hash: String::new(),
                dimension: 384,
                source: doc.content_type.clone(),
            },
        }
    }
}
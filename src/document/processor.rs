use anyhow::Result;
use std::sync::Arc;
use tokio::sync::RwLock;
use chrono::Utc;
use uuid::Uuid;
use crate::vector::VectorStore;
use crate::document::{Document, DocumentMetadata};

pub struct DocumentProcessor {
    vector_store: Arc<RwLock<VectorStore>>,
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
            score: 0.0,
        }
    }
}

impl DocumentProcessor {
    pub fn new(vector_store: Arc<RwLock<VectorStore>>) -> Self {
        Self { vector_store }
    }

    pub async fn process_document(&self, document: Document) -> Result<String> {
        let vector_store = self.vector_store.write().await;
        let vec_doc: crate::vector::VectorDocument = (&document).into();
        vector_store.add_document(&vec_doc).await?;
        Ok(document.id.to_string())
    }
}
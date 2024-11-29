use serde::{Deserialize, Serialize};
use uuid::Uuid;
use crate::document::Document;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VectorDocument {
    pub id: Uuid,
    pub vector: Vec<f32>,
    pub metadata: VectorMetadata,
    pub score: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VectorMetadata {
    pub title: String,
    pub content_hash: String,
    pub dimension: usize,
    pub source: String,
}

impl From<&Document> for VectorDocument {
    fn from(doc: &Document) -> Self {
        Self {
            id: doc.id,
            vector: doc.vector_embedding.clone().unwrap_or_default(),
            metadata: VectorMetadata {
                title: doc.title.clone(),
                content_hash: String::new(),
                dimension: 384, // Default dimension
                source: doc.content_type.clone(),
            },
            score: 0.0,
        }
    }
}
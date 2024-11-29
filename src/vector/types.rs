use serde::{Deserialize, Serialize};
use uuid::Uuid;

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

impl Default for VectorDocument {
    fn default() -> Self {
        Self {
            id: Uuid::new_v4(),
            vector: Vec::new(),
            metadata: VectorMetadata {
                title: String::new(),
                content_hash: String::new(),
                dimension: 384,
                source: String::new(),
            },
            score: 0.0,
        }
    }
}
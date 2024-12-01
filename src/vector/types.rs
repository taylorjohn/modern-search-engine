use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VectorDocument {
    pub id: String,
    pub title: String,
    pub content: String,
    pub vector: Vec<f32>,
    pub metadata: VectorMetadata,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct VectorMetadata {
    pub content_hash: String,
    pub dimension: usize,
    pub source: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VectorSearchResult {
    pub id: String,
    pub title: String,
    pub content: String,
    pub score: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VectorQuery {
    pub embedding: Vec<f32>,
    pub k: usize,
    pub threshold: f32,
}

impl Default for VectorDocument {
    fn default() -> Self {
        Self {
            id: String::new(),
            title: String::new(),
            content: String::new(),
            vector: Vec::new(),
            metadata: VectorMetadata::default(),
        }
    }
}
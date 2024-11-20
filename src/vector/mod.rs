pub mod store;
pub mod embeddings;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VectorDocument {
    pub id: String,
    pub vector: Vec<f32>,
    pub metadata: VectorMetadata,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VectorMetadata {
    pub title: String,
    pub content_hash: String,
    pub dimension: usize,
    pub source: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VectorSearchResult {
    pub document_id: String,
    pub score: f32,
    pub vector: Vec<f32>,
}

pub trait VectorIndex: Send + Sync {
    fn add_vector(&mut self, document: VectorDocument) -> anyhow::Result<()>;
    fn search(&self, query: &[f32], limit: usize) -> anyhow::Result<Vec<VectorSearchResult>>;
    fn get_vector(&self, id: &str) -> anyhow::Result<Option<VectorDocument>>;
    fn delete_vector(&mut self, id: &str) -> anyhow::Result<()>;
}
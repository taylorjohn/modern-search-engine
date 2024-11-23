// src/search/types.rs
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResult {
    pub id: String,
    pub score: f32,
    pub content: String,
    pub metadata: SearchMetadata,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchOptions {
    pub max_results: usize,
    pub min_score: f32,
    pub use_vector: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchMetadata {
    pub title: String,
    pub content_type: String,
    pub created_at: String,
}
// src/types.rs
use serde::{Deserialize, Serialize};
use sqlx::types::Uuid;
use sqlx::types::JsonValue;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Document {
    pub id: Uuid,
    pub title: String,
    pub content: String,
    pub content_type: String,
    pub vector_embedding: Option<Vec<f32>>,
    pub metadata: DocumentMetadata,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentMetadata {
    pub author: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub tags: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct SearchResult {
    pub id: Uuid,
    pub title: String,
    pub content: String,
    pub score: f32,
    pub metadata: JsonValue,
}
#[derive(Debug, Clone, Serialize)]
pub struct SearchResponse {
    pub results: Vec<SearchResult>,
    pub total: usize,
    pub took_ms: u64,
    pub query: String,
}

#[derive(Debug, Clone)]
pub struct SearchOptions {
    pub limit: usize,
    pub offset: usize,
    pub min_score: f32,
}

impl Default for SearchOptions {
    fn default() -> Self {
        Self {
            limit: 10,
            offset: 0,
            min_score: 0.1,
        }
    }
}
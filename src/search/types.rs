use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SearchType {
    Text,
    Vector,
    Hybrid,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchRequest {
    pub query: String,
    #[serde(default = "default_limit")]
    pub limit: usize,
    #[serde(default)]
    pub offset: usize,
    #[serde(default)]
    pub fields: Option<Vec<String>>,
    #[serde(default)]
    pub use_vector: bool,
    #[serde(default)]
    pub options: Option<SearchOptions>,
}

fn default_limit() -> usize {
    10
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResponse {
    pub query: QueryInfo,
    pub results: Vec<SearchResult>,
    pub analytics: SearchAnalytics,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueryInfo {
    pub original: String,
    pub expanded: String,
    pub vector_query: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub embedding: Option<Vec<f32>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResult {
    pub id: Uuid,
    pub title: String,
    pub content: String,
    pub scores: SearchScores,
    pub metadata: SearchMetadata,
    pub highlights: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct SearchScores {
    pub text_score: f32,
    pub vector_score: f32,
    pub final_score: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct SearchMetadata {
    pub source_type: String,
    pub content_type: String,
    pub author: Option<String>,
    pub created_at: DateTime<Utc>,
    pub last_modified: DateTime<Utc>,
    pub word_count: usize,
    pub tags: Vec<String>,
    pub custom_metadata: HashMap<String, serde_json::Value>,
}

impl SearchMetadata {
    pub fn from_document(doc: &crate::document::Document) -> Self {
        Self {
            source_type: doc.metadata.source_type.clone(),
            content_type: doc.content_type.clone(),
            author: doc.metadata.author.clone(),
            created_at: doc.metadata.created_at,
            last_modified: doc.metadata.last_modified,
            word_count: doc.content.split_whitespace().count(),
            tags: doc.metadata.tags.clone(),
            custom_metadata: doc.metadata.custom_metadata.iter()
                .map(|(k, v)| (k.clone(), serde_json::Value::String(v.clone())))
                .collect(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchAnalytics {
    pub execution_time_ms: u64,
    pub total_results: usize,
    pub max_score: f32,
    pub search_type: SearchType,
    pub vector_query: bool,
    pub field_weights: Option<HashMap<String, f32>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub timing_breakdown: Option<TimingBreakdown>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimingBreakdown {
    pub query_parsing_ms: u64,
    pub vector_search_ms: u64,
    pub text_search_ms: u64,
    pub scoring_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchOptions {
    #[serde(default = "default_use_vector")]
    pub use_vector: bool,
    #[serde(default = "default_field_weights")]
    pub field_weights: HashMap<String, f32>,
    #[serde(default = "default_min_score")]
    pub min_score: f32,
}

fn default_use_vector() -> bool {
    true
}

fn default_min_score() -> f32 {
    0.1
}

fn default_field_weights() -> HashMap<String, f32> {
    let mut weights = HashMap::new();
    weights.insert("title".to_string(), 1.5);
    weights.insert("content".to_string(), 1.0);
    weights.insert("tags".to_string(), 0.5);
    weights
}

impl Default for SearchOptions {
    fn default() -> Self {
        Self {
            use_vector: default_use_vector(),
            field_weights: default_field_weights(),
            min_score: default_min_score(),
        }
    }
}

impl VectorStore {
    pub async fn new(pool: PgPool, dimension: usize) -> Result<Self> {
        // Initialize extensions sequentially
        sqlx::query!(r#"DO $$ BEGIN CREATE EXTENSION IF NOT EXISTS vector; EXCEPTION WHEN OTHERS THEN NULL; END $$"#)
            .execute(&pool)
            .await
            .context("Failed to create vector extension")?;

        sqlx::query!(r#"DO $$ BEGIN CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; EXCEPTION WHEN OTHERS THEN NULL; END $$"#)
            .execute(&pool)
            .await
            .context("Failed to create UUID extension")?;

        sqlx::query!(
            r#"
            CREATE OR REPLACE FUNCTION vector_cosine_similarity(a vector, b vector) 
            RETURNS float8 AS $$
            SELECT 1 - (a <=> b)::float8;
            $$ LANGUAGE SQL IMMUTABLE STRICT PARALLEL SAFE;
            "#
        )
        .execute(&pool)
        .await
        .context("Failed to create similarity function")?;

        Ok(Self { pool, dimension })
    }
}

#[derive(Debug, thiserror::Error)]
pub enum SearchError {
    #[error("Invalid search query: {0}")]
    InvalidQuery(String),
    #[error("Vector search error: {0}")]
    VectorError(String),
    #[error("Database error: {0}")]
    DatabaseError(#[from] sqlx::Error),
    #[error("Internal error: {0}")]
    Internal(String),
}

pub type SearchResult<T> = std::result::Result<T, SearchError>;
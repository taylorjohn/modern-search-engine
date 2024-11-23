// src/api/types.rs

use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
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
}

fn default_limit() -> usize {
    10
}

#[derive(Debug, Serialize)]
pub struct SearchResponse {
    pub query: QueryInfo,
    pub results: Vec<SearchResult>,
    pub analytics: SearchAnalytics,
}

#[derive(Debug, Serialize)]
pub struct QueryInfo {
    pub original: String,
    pub expanded: String,
    pub vector_query: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct SearchResult {
    pub id: Uuid,
    pub title: String,
    pub content: String,
    pub scores: SearchScores,
    pub metadata: SearchMetadata,
    pub highlights: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct SearchScores {
    pub text_score: f32,
    pub vector_score: f32,
    pub final_score: f32,
}

#[derive(Debug, Clone, Serialize)]
pub struct SearchMetadata {
    pub source_type: String,
    pub author: Option<String>, 
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub word_count: usize,
    pub content_type: String,
    pub last_modified: chrono::DateTime<chrono::Utc>,
    pub tags: Vec<String>,
    pub custom_metadata: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Serialize)]
pub struct SearchAnalytics {
    pub execution_time_ms: u64,
    pub total_results: usize,
    pub max_score: f32,
    pub search_type: String,
    pub vector_query: bool,
}

#[derive(Debug)]
pub struct ApiError {
    pub code: String,
    pub message: String,
    pub details: Option<serde_json::Value>,
}

#[derive(Debug, Serialize)]
pub struct ApiResponse<T> {
    pub data: T,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
    pub success: bool,
}
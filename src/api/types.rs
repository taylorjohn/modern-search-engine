// src/api/types.rs

use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use chrono::{DateTime, Utc};

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

#[derive(Debug, Serialize, Clone)]
pub struct SearchResult {
    pub id: String,  // Changed from Uuid to String for easier handling
    pub title: String,
    pub content: String,
    pub scores: SearchScores,
    pub metadata: SearchMetadata,
    pub highlights: Vec<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct SearchScores {
    pub text_score: f32,
    pub vector_score: f32,
    pub final_score: f32,
}

#[derive(Debug, Serialize, Clone)]
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
    pub fields: Vec<String>,
}

#[derive(Debug, Serialize)]
pub struct SearchAnalytics {
    pub execution_time_ms: u64,
    pub total_results: usize,
    pub max_score: f32,
    pub search_type: String,
    pub vector_query: bool,
}

#[derive(Debug, thiserror::Error)]
pub enum ApiError {
    #[error("Database error: {0}")]
    Database(String),
    
    #[error("Not found: {0}")]
    NotFound(String),
    
    #[error("Invalid request: {0}")]
    InvalidRequest(String),
    
    #[error("Processing error: {0}")]
    Processing(String),
    
    #[error("Internal error: {0}")]
    Internal(String),
}

impl warp::reject::Reject for ApiError {}

#[derive(Debug, Serialize)]
pub struct ApiResponse<T> {
    pub data: T,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
    pub success: bool,
}
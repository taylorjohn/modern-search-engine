use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Deserialize)]
pub struct SearchQuery {
    pub q: String,
    #[serde(default = "default_limit")]
    pub limit: usize,
    #[serde(default)]
    pub offset: usize,
    #[serde(default)]
    pub fields: Option<Vec<String>>,
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

#[derive(Debug, Serialize)]
pub struct SearchAnalytics {
    pub execution_time_ms: u64,
    pub total_results: usize,
    pub max_score: f32,
    pub search_type: String,
    pub vector_query: bool,
}

#[derive(Debug, Serialize)]
pub struct SearchResult {
    pub id: String,
    pub title: String,
    pub content: String,
    pub scores: SearchScores,
    pub metadata: SearchMetadata,
    pub highlights: Vec<String>,
}

#[derive(Debug, Serialize, Default)]
pub struct SearchScores {
    pub text_score: f32,
    pub vector_score: f32,
    pub final_score: f32,
}

#[derive(Debug, Serialize)]
pub struct SearchMetadata {
    pub source_type: String,
    pub author: Option<String>,
    pub created_at: DateTime<Utc>,
    pub word_count: usize,
}
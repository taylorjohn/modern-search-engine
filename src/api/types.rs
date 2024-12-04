// src/api/types.rs

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Deserialize)]
pub struct SearchRequest {
    pub query: String,
    #[serde(default)]
    pub filters: SearchFilters,
    #[serde(default)]
    pub options: SearchOptions,
}

#[derive(Debug, Default, Deserialize)]
pub struct SearchFilters {
    #[serde(default)]
    pub content_types: Vec<String>,
    #[serde(default = "default_min_score")]
    pub min_score: f32,
    #[serde(default = "default_true")]
    pub use_vector_search: bool,
}

#[derive(Debug, Default, Deserialize)]
pub struct SearchOptions {
    #[serde(default = "default_true")]
    pub include_highlights: bool,
    #[serde(default = "default_true")]
    pub include_scores: bool,
}

#[derive(Debug, Serialize)]
pub struct SearchResponse {
    pub results: Vec<SearchResult>,
    pub analytics: SearchAnalytics,
}

#[derive(Debug, Serialize)]
pub struct SearchResult {
    pub id: String,
    pub title: String,
    pub content: String,
    pub highlights: Vec<String>,
    pub scores: SearchScores,
    pub metadata: DocumentMetadata,
    pub url: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct SearchAnalytics {
    pub total_results: usize,
    pub execution_time_ms: u64,
    pub max_score: f32,
    pub vector_search: bool,
    pub query_expansion: bool,
}

#[derive(Debug, Serialize)]
pub struct SearchScores {
    pub text_score: f32,
    pub vector_score: f32,
    pub final_score: f32,
    pub title_score: f32,
    pub content_score: f32,
}

fn default_min_score() -> f32 {
    0.1
}

fn default_true() -> bool {
    true
}
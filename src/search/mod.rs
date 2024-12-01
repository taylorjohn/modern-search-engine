pub mod engine;
pub mod query_parser;
pub mod executor;
pub mod scoring;

pub use self::engine::SearchEngine;
pub use self::query_parser::QueryParser;
pub use self::executor::SearchExecutor;
pub use self::scoring::ScoreCalculator;

use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResult {
    pub id: String,
    pub title: String,
    pub content: String,
    pub scores: SearchScores,
    pub metadata: SearchMetadata,
    pub highlights: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchScores {
    pub text_score: f32,
    pub vector_score: f32,
    pub final_score: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchMetadata {
    pub source_type: String,
    pub author: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub last_modified: chrono::DateTime<chrono::Utc>,
    pub word_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchConfig {
    pub max_results: usize,
    pub min_score: f32,
    pub vector_weight: f32,
    pub text_weight: f32,
    pub use_query_expansion: bool,
}

impl Default for SearchConfig {
    fn default() -> Self {
        Self {
            max_results: 10,
            min_score: 0.1,
            vector_weight: 0.6,
            text_weight: 0.4,
            use_query_expansion: true,
        }
    }
}
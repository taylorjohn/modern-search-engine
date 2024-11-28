pub mod types;
pub mod engine;
pub use self::types::*;
pub mod query_parser;
pub mod executor;
pub mod scoring;

pub use self::engine::SearchEngine;
pub use self::query_parser::QueryParser;
pub use self::executor::SearchExecutor;
pub use self::scoring::ScoreCalculator;

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchResult {
    pub id: String,
    pub title: String,
    pub content: String,
    pub scores: SearchScores,
    pub metadata: SearchMetadata,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchScores {
    pub text_score: f32,
    pub vector_score: f32,
    pub final_score: f32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchMetadata {
    pub source_type: String,
    pub author: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub word_count: usize,
}
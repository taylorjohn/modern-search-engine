use crate::search::engine::SearchEngine;
use crate::document::{DocumentUpload, DocumentProcessor};
use crate::api::error::ApiError;
use warp::{Reply, Rejection};
use std::sync::Arc;
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct SearchRequest {
    pub q: String,
    #[serde(default = "default_limit")]
    pub limit: usize,
    #[serde(default)]
    pub offset: usize,
}

fn default_limit() -> usize {
    10
}

#[derive(Debug, Serialize)]
pub struct SearchResponse {
    pub results: Vec<SearchResult>,
    pub total: usize,
    pub took_ms: u64,
}

#[derive(Debug, Serialize)]
pub struct SearchResult {
    pub id: String,
    pub title: String,
    pub content: String,
    pub score: f32,
}

pub async fn handle_search(
    query: SearchRequest,
    engine: Arc<SearchEngine>
) -> Result<impl Reply, Rejection> {
    let start = std::time::Instant::now();

    let search_results = engine.search(&query.q, Some(query.limit), Some(query.offset))
        .await
        .map_err(|e| warp::reject::custom(ApiError::SearchError(e)))?;

    let total = search_results.len();
    let results = search_results.into_iter()
        .map(|doc| SearchResult {
            id: doc.id,
            title: doc.title,
            content: doc.content,
            score: doc.scores.final_score,
        })
        .collect();

    Ok(warp::reply::json(&SearchResponse {
        results,
        total,
        took_ms: start.elapsed().as_millis() as u64,
    }))
}

pub async fn handle_document_upload(
    upload: DocumentUpload,
    processor: Arc<DocumentProcessor>
) -> Result<impl Reply, Rejection> {
    let result = processor.process_document(upload)
        .await
        .map_err(|e| warp::reject::custom(ApiError::ProcessingError(e)))?;

    Ok(warp::reply::json(&result))
}
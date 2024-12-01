use std::sync::Arc;
use warp::{Reply, Rejection};
use serde::{Deserialize, Serialize};
use crate::search::engine::SearchEngine;
use crate::document::processor::DocumentProcessor;
use crate::api::error::ApiError;

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
    query: QueryInfo,
    results: Vec<SearchResult>,
    analytics: SearchAnalytics,
}

#[derive(Debug, Serialize)]
pub struct QueryInfo {
    original: String,
    expanded: String,
    vector_query: bool,
    fields: Vec<String>,
}

#[derive(Debug, Serialize)]
pub struct SearchResult {
    id: String,
    title: String,
    content: String,
    score: f32,
    highlights: Vec<String>,
    metadata: DocumentMetadata,
}

#[derive(Debug, Serialize)]
pub struct SearchAnalytics {
    execution_time_ms: u64,
    total_results: usize,
    max_score: f32,
    search_type: String,
    vector_query: bool,
}

#[derive(Debug, Serialize)]
pub struct DocumentMetadata {
    source_type: String,
    word_count: usize,
    created_at: chrono::DateTime<chrono::Utc>,
    last_modified: chrono::DateTime<chrono::Utc>,
}

pub async fn handle_search(
    query: SearchQuery,
    search_engine: Arc<SearchEngine>,
) -> Result<impl Reply, Rejection> {
    let start_time = std::time::Instant::now();

    let results = search_engine
        .search(&query.q, Some(query.limit), Some(query.offset))
        .await
        .map_err(|e| warp::reject::custom(ApiError::SearchError(e.to_string())))?;

    let response = SearchResponse {
        query: QueryInfo {
            original: query.q.clone(),
            expanded: format!("{} (expanded)", query.q),
            vector_query: true,
            fields: query.fields.unwrap_or_default(),
        },
        results: results.clone(),
        analytics: SearchAnalytics {
            execution_time_ms: start_time.elapsed().as_millis() as u64,
            total_results: results.len(),
            max_score: results.iter().map(|r| r.score).fold(0.0, f32::max),
            search_type: "hybrid".to_string(),
            vector_query: true,
        },
    };

    Ok(warp::reply::json(&response))
}

pub async fn handle_document_upload(
    processor: Arc<DocumentProcessor>,
    document: DocumentUpload,
) -> Result<impl Reply, Rejection> {
    let result = processor
        .process_document(document)
        .await
        .map_err(|e| warp::reject::custom(ApiError::ProcessingError(e.to_string())))?;

    Ok(warp::reply::json(&result))
}

pub async fn handle_status_check(
    processor: Arc<DocumentProcessor>,
    processing_id: String,
) -> Result<impl Reply, Rejection> {
    let status = processor
        .get_processing_status(&processing_id)
        .await
        .map_err(|e| warp::reject::custom(ApiError::ProcessingError(e.to_string())))?;

    Ok(warp::reply::json(&status))
}

#[derive(Debug, Serialize)]
pub struct ProcessingResponse {
    id: String,
    status: String,
    message: Option<String>,
}
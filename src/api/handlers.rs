use crate::search::engine::SearchEngine;
use crate::document::processor::DocumentProcessor;
use crate::vector::store::VectorStore;
use crate::api::error::ApiError;

use serde::{Deserialize, Serialize};
use warp::{Reply, Rejection};
use std::sync::Arc;
use tokio::sync::RwLock;
use anyhow::Result;
use uuid::Uuid;

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
    author: Option<String>,
    tags: Vec<String>,
    scores: ScoreBreakdown,
    highlights: Vec<String>,
    metadata: DocumentMetadata,
}

#[derive(Debug, Serialize)]
pub struct ScoreBreakdown {
    text_score: f32,
    vector_score: f32,
    final_score: f32,
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

    // Execute search
    let search_result = search_engine.search(
        &query.q,
        query.limit,
        query.offset,
        query.fields.as_deref(),
    ).await.map_err(|e| warp::reject::custom(ApiError::SearchError(e)))?;

    // Format response
    let response = SearchResponse {
        query: QueryInfo {
            original: query.q.clone(),
            expanded: search_result.expanded_query,
            vector_query: search_result.vector_query,
            fields: search_result.searched_fields,
        },
        results: search_result.documents.into_iter().map(|doc| SearchResult {
            id: doc.id,
            title: doc.title,
            content: doc.content,
            author: doc.author,
            tags: doc.tags,
            scores: ScoreBreakdown {
                text_score: doc.scores.text_score,
                vector_score: doc.scores.vector_score,
                final_score: doc.scores.final_score,
            },
            highlights: doc.highlights,
            metadata: DocumentMetadata {
                source_type: doc.metadata.source_type,
                word_count: doc.metadata.word_count,
                created_at: doc.metadata.created_at,
                last_modified: doc.metadata.last_modified,
            },
        }).collect(),
        analytics: SearchAnalytics {
            execution_time_ms: start_time.elapsed().as_millis() as u64,
            total_results: search_result.total_results,
            max_score: search_result.max_score,
            search_type: search_result.search_type,
            vector_query: search_result.vector_query,
        },
    };

    Ok(warp::reply::json(&response))
}

pub async fn handle_document_upload(
    processor: Arc<DocumentProcessor>,
    document: DocumentUpload,
) -> Result<impl Reply, Rejection> {
    let processing_id = Uuid::new_v4();
    
    // Start processing
    let result = processor.process_document(document)
        .await
        .map_err(|e| warp::reject::custom(ApiError::ProcessingError(e)))?;

    Ok(warp::reply::json(&ProcessingResponse {
        id: processing_id.to_string(),
        status: "completed".to_string(),
        document: Some(result),
    }))
}

pub async fn handle_status_check(
    processor: Arc<DocumentProcessor>,
    processing_id: String,
) -> Result<impl Reply, Rejection> {
    let status = processor.get_processing_status(&processing_id)
        .await
        .map_err(|e| warp::reject::custom(ApiError::StatusError(e)))?;

    Ok(warp::reply::json(&status))
}

#[derive(Debug, Serialize)]
pub struct ProcessingResponse {
    id: String,
    status: String,
    document: Option<ProcessedDocument>,
}

// Error handling for rejections
pub async fn handle_rejection(err: Rejection) -> Result<impl Reply, Rejection> {
    if let Some(e) = err.find::<ApiError>() {
        let (code, message) = match e {
            ApiError::SearchError(e) => (warp::http::StatusCode::BAD_REQUEST, e.to_string()),
            ApiError::ProcessingError(e) => (warp::http::StatusCode::BAD_REQUEST, e.to_string()),
            ApiError::StatusError(e) => (warp::http::StatusCode::NOT_FOUND, e.to_string()),
        };

        Ok(warp::reply::with_status(
            warp::reply::json(&serde_json::json!({
                "error": message
            })),
            code,
        ))
    } else {
        Err(err)
    }
}
use std::sync::Arc;
use warp::{Reply, Rejection, Filter};
use serde::{Serialize, Deserialize};
use crate::search::engine::SearchEngine;
use crate::document::{ProcessingStatus, Document, DocumentMetadata};
use crate::document::processor::{DocumentProcessor, DocumentUpload};
use crate::api::error::ApiError;
use uuid::Uuid;
use anyhow::Result;

#[derive(Debug, Deserialize)]
pub struct SearchQuery {
    pub q: String,
    #[serde(default = "default_limit")]
    pub limit: usize,
    #[serde(default)]
    pub offset: usize,
    #[serde(default)]
    pub use_vector: bool,
}

fn default_limit() -> usize {
    10
}

#[derive(Debug, Serialize)]
pub struct SearchResponse {
    pub query: String,
    pub results: Vec<crate::search::types::SearchResult>,
    pub total: usize,
    pub took_ms: u64,
}

pub async fn handle_search(
    query: SearchQuery,
    engine: Arc<SearchEngine>,
) -> Result<impl Reply, Rejection> {
    let start = std::time::Instant::now();
    
    let search_response = engine.search(
        &query.q,
        Some(query.limit),
        Some(query.offset),
    )
    .await
    .map_err(|e| ApiError::InternalError(e))?;

    let response = SearchResponse {
        query: query.q,
        total: search_response.results.len(),
        took_ms: start.elapsed().as_millis() as u64,
        results: search_response.results,
    };

    Ok(warp::reply::json(&response))
}

#[derive(Debug, Deserialize)]
pub struct DocumentUploadRequest {
    pub content: String,
    pub title: Option<String>,
    pub content_type: String,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Serialize)]
pub struct DocumentUploadResponse {
    pub id: Uuid,
    pub status: String,
    pub processing_id: Uuid,
}

pub async fn handle_document_upload(
    request: DocumentUploadRequest,
    processor: Arc<DocumentProcessor>,
) -> Result<impl Reply, Rejection> {
    // Convert metadata to DocumentMetadata
    let metadata = match request.metadata {
        Some(value) => serde_json::from_value(value)
            .map_err(|e| ApiError::InvalidRequest(format!("Invalid metadata: {}", e)))?,
        None => DocumentMetadata::default(),
    };

    // Create document upload request
    let upload = DocumentUpload::Text {
        content: request.content,
        title: request.title.unwrap_or_else(|| "Untitled".to_string()),
        metadata: Some(metadata.custom_metadata),
    };

    let processing_result = processor
        .process_document(upload)
        .await
        .map_err(|e| ApiError::ProcessingError(e))?;

    let response = DocumentUploadResponse {
        id: processing_result.id,
        status: "processing".to_string(),
        processing_id: processing_result.processing_id,
    };

    Ok(warp::reply::with_status(
        warp::reply::json(&response),
        warp::http::StatusCode::ACCEPTED,
    ))
}

#[derive(Debug, Serialize)]
pub struct ProcessingStatusResponse {
    pub id: Uuid,
    pub status: String,
    pub progress: f32,
    pub message: Option<String>,
    pub result: Option<serde_json::Value>,
}

pub async fn handle_status_check(
    processing_id: String,
    processor: Arc<DocumentProcessor>,
) -> Result<impl Reply, Rejection> {
    let id = Uuid::parse_str(&processing_id)
        .map_err(|_| ApiError::InvalidRequest("Invalid processing ID".to_string()))?;

    let status = processor
        .get_processing_status(&id)
        .await
        .map_err(|e| ApiError::ProcessingError(e))?;

    let response = match status {
        ProcessingStatus::Pending => ProcessingStatusResponse {
            id,
            status: "pending".to_string(),
            progress: 0.0,
            message: None,
            result: None,
        },
        ProcessingStatus::Processing(progress) => ProcessingStatusResponse {
            id,
            status: "processing".to_string(),
            progress,
            message: None,
            result: None,
        },
        ProcessingStatus::Completed(doc) => ProcessingStatusResponse {
            id,
            status: "completed".to_string(),
            progress: 100.0,
            message: None,
            result: Some(serde_json::to_value(doc)?),
        },
        ProcessingStatus::Failed(error) => ProcessingStatusResponse {
            id,
            status: "failed".to_string(),
            progress: 0.0,
            message: Some(error),
            result: None,
        },
    };

    Ok(warp::reply::json(&response))
}

pub fn json_body<T>() -> impl Filter<Extract = (T,), Error = Rejection> + Clone 
where
    T: for<'de> Deserialize<'de> + Send,
{
    use warp::Filter;
    warp::body::content_length_limit(1024 * 1024 * 10)
        .and(warp::body::json())
}

#[cfg(test)]
mod tests {
    use super::*;
    use warp::test::request;

    #[tokio::test]
    async fn test_search_handler() {
        // Mock dependencies
        let engine = Arc::new(SearchEngine::mock());
        
        // Create test query
        let query = SearchQuery {
            q: "test".to_string(),
            limit: 10,
            offset: 0,
            use_vector: false,
        };

        // Make request
        let response = handle_search(query, engine)
            .await
            .expect("Search should succeed");

        // Verify response
        assert!(response.status().is_success());
    }

    #[tokio::test]
    async fn test_upload_handler() {
        // TODO: Implement test
    }

    #[tokio::test]
    async fn test_status_handler() {
        // TODO: Implement test
    }
}
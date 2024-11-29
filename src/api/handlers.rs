use std::sync::Arc;
use warp::{Reply, Rejection};
use serde::{Deserialize, Serialize};
use crate::search::SearchEngine;
use crate::document::DocumentProcessor;
use crate::api::error::ApiError;

#[derive(Debug, Deserialize)]
pub struct SearchQuery {
    pub q: String,
    #[serde(default = "default_limit")]
    pub limit: usize,
    #[serde(default)]
    pub offset: usize,
}

fn default_limit() -> usize {
    10
}

pub async fn handle_search(
    query: SearchQuery,
    engine: Arc<SearchEngine>,
) -> Result<impl Reply, Rejection> {
    let results = engine.search(&query.q, Some(query.limit), Some(query.offset))
        .await
        .map_err(|e| warp::reject::custom(ApiError::SearchError(e)))?;

    Ok(warp::reply::json(&results))
}

#[derive(Debug, Serialize)]
pub struct DocumentUploadResponse {
    pub id: String,
    pub status: String,
}

pub async fn handle_document_upload(
    upload: crate::document::DocumentUpload,
    processor: Arc<DocumentProcessor>,
) -> Result<impl Reply, Rejection> {
    let id = processor.process_document(upload)
        .await
        .map_err(|e| warp::reject::custom(ApiError::ProcessingError(e)))?;

    Ok(warp::reply::json(&DocumentUploadResponse {
        id,
        status: "processing".to_string(),
    }))
}

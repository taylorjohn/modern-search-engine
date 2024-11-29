use std::sync::Arc;
use warp::{Reply, Rejection};
use crate::search::SearchEngine;
use crate::document::DocumentProcessor;
use crate::api::error::ApiError;

pub async fn handle_search(
    query: String,
    engine: Arc<SearchEngine>,
) -> Result<impl Reply, Rejection> {
    let results = engine.search(&query, None, None)
        .await
        .map_err(|e| warp::reject::custom(ApiError::SearchError(e)))?;

    Ok(warp::reply::json(&results))
}

pub async fn handle_document_upload(
    doc: crate::document::Document,
    processor: Arc<DocumentProcessor>,
) -> Result<impl Reply, Rejection> {
    let id = processor.process_document(doc)
        .await
        .map_err(|e| warp::reject::custom(ApiError::ProcessingError(e.to_string())))?;

    Ok(warp::reply::json(&serde_json::json!({
        "id": id,
        "status": "processing"
    })))
}
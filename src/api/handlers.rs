// src/api/handlers.rs

use crate::search::engine::SearchEngine;
use crate::search::types::{SearchRequest, SearchResponse, SearchResult};
use crate::document::processor::DocumentProcessor;
use crate::api::error::ApiError;
use serde::{Deserialize, Serialize};
use warp::{Reply, Rejection};
use std::sync::Arc;
use uuid::Uuid;
use std::convert::Infallible;

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

pub async fn handle_search(
    query: SearchQuery,
    search_engine: Arc<SearchEngine>,
) -> Result<impl Reply, Rejection> {
    let search_result = search_engine
        .search(
            &query.q,
            Some(query.limit),
            Some(query.offset),
            query.fields.as_deref(),
        )
        .await
        .map_err(|e| warp::reject::custom(ApiError::SearchError(e)))?;

    Ok(warp::reply::json(&search_result))
}

pub async fn handle_document_upload(
    processor: Arc<DocumentProcessor>,
    document: DocumentUpload,
) -> Result<impl Reply, Rejection> {
    let processing_id = Uuid::new_v4();
    
    let result = processor
        .process_document(document)
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
    let status = processor
        .get_processing_status(&processing_id)
        .await
        .map_err(|e| warp::reject::custom(ApiError::StatusError(e)))?;

    Ok(warp::reply::json(&status))
}

#[derive(Debug, Serialize)]
pub struct ProcessingResponse<T> {
    id: String,
    status: String,
    document: Option<T>,
}

pub async fn handle_rejection(err: Rejection) -> Result<impl Reply, Infallible> {
    let (code, response) = if let Some(e) = err.find::<ApiError>() {
        match e {
            ApiError::SearchError(_) => (
                warp::http::StatusCode::BAD_REQUEST,
                e.to_response(),
            ),
            ApiError::ProcessingError(_) => (
                warp::http::StatusCode::BAD_REQUEST,
                e.to_response(),
            ),
            ApiError::StatusError(_) => (
                warp::http::StatusCode::NOT_FOUND,
                e.to_response(),
            ),
            _ => (
                warp::http::StatusCode::INTERNAL_SERVER_ERROR,
                e.to_response(),
            ),
        }
    } else if err.is_not_found() {
        (
            warp::http::StatusCode::NOT_FOUND,
            ErrorResponse {
                code: "NOT_FOUND".to_string(),
                message: "Not Found".to_string(),
                details: None,
            },
        )
    } else {
        (
            warp::http::StatusCode::INTERNAL_SERVER_ERROR,
            ErrorResponse {
                code: "INTERNAL_ERROR".to_string(),
                message: "Internal Server Error".to_string(),
                details: None,
            },
        )
    };

    Ok(warp::reply::with_status(warp::reply::json(&response), code))
}
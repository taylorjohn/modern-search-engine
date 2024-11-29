use thiserror::Error;
use warp::reject::Reject;
use serde::Serialize;

#[derive(Error, Debug)]
pub enum ApiError {
    #[error("Search error: {0}")]
    SearchError(anyhow::Error),
    #[error("Database error: {0}")]
    DatabaseError(anyhow::Error),
    #[error("Processing error: {0}")]
    ProcessingError(String),
    #[error("Document not found: {0}")]
    DocumentNotFound(String),
}

impl Reject for ApiError {}

#[derive(Serialize)]
pub struct ErrorResponse {
    pub code: String,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<serde_json::Value>,
}
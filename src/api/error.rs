use serde::Serialize;
use thiserror::Error;
use warp::reject::Reject;

#[derive(Error, Debug)]
pub enum ApiError {
    #[error("Search error: {0}")]
    SearchError(anyhow::Error),

    #[error("Processing error: {0}")]
    ProcessingError(anyhow::Error),

    #[error("Document not found: {0}")]
    DocumentNotFound(String),

    #[error("Invalid request: {0}")]
    InvalidRequest(String),

    #[error("Database error: {0}")]
    DbError(anyhow::Error),

    #[error("Internal server error: {0}")]
    InternalError(anyhow::Error),
}

impl Reject for ApiError {}

#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub code: String,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<serde_json::Value>,
}
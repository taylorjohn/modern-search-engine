use thiserror::Error;
use warp::reject::Reject;
use serde::Serialize;

#[derive(Error, Debug)]
pub enum ApiError {
    #[error("Search error: {0}")]
    SearchError(String),
    
    #[error("Database error: {0}")]
    DatabaseError(String),
    
    #[error("Processing error: {0}")]
    ProcessingError(String),

    #[error("Document not found: {0}")]
    DocumentNotFound(String),
}

impl Reject for ApiError {}

#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub code: String,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<serde_json::Value>,
}

impl From<anyhow::Error> for ApiError {
    fn from(err: anyhow::Error) -> Self {
        ApiError::SearchError(err.to_string())
    }
}

impl From<sqlx::Error> for ApiError {
    fn from(err: sqlx::Error) -> Self {
        ApiError::DatabaseError(err.to_string())
    }
}
use thiserror::Error;
use warp::reject::Reject;

#[derive(Error, Debug)]
pub enum ApiError {
    #[error("Error: {0}")]
    Error(String),

    #[error("Document not found: {0}")]
    DocumentNotFound(String),

    #[error("Invalid request: {0}")]
    InvalidRequest(String),
}

impl ApiError {
    pub fn from_anyhow(err: anyhow::Error) -> Self {
        ApiError::Error(err.to_string())
    }
}

impl Reject for ApiError {}

#[derive(Debug, serde::Serialize)]
pub struct ErrorResponse {
    pub code: String,
    pub message: String,
}
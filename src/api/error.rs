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
}

impl From<anyhow::Error> for ApiError {
    fn from(err: anyhow::Error) -> Self {
        ApiError::SearchError(err)
    }
}

impl Reject for ApiError {}

#[derive(Debug, serde::Serialize)]
pub struct ErrorResponse {
    pub code: String,
    pub message: String,
}
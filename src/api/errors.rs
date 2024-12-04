use thiserror::Error;
use warp::reject::Reject;

#[derive(Error, Debug)]
pub enum ApiError {
    #[error("Search error: {0}")]
    SearchError(#[from] anyhow::Error),

    #[error("Document not found: {0}")]
    DocumentNotFound(String),

    #[error("Invalid request: {0}")]
    InvalidRequest(String),

    #[error("Processing error: {0}")]
    ProcessingError(#[from] std::io::Error),

    #[error("Database error: {0}")]
    DatabaseError(#[from] sqlx::Error),

    #[error("Internal error: {0}")]
    InternalError(String),
}

impl Reject for ApiError {}

#[derive(Debug, serde::Serialize)]
pub struct ErrorResponse {
    pub code: String,
    pub message: String,
}

impl From<ApiError> for ErrorResponse {
    fn from(error: ApiError) -> Self {
        let code = match &error {
            ApiError::SearchError(_) => "SEARCH_ERROR",
            ApiError::DocumentNotFound(_) => "NOT_FOUND",
            ApiError::InvalidRequest(_) => "INVALID_REQUEST",
            ApiError::ProcessingError(_) => "PROCESSING_ERROR",
            ApiError::DatabaseError(_) => "DATABASE_ERROR",
            ApiError::InternalError(_) => "INTERNAL_ERROR",
        };

        Self {
            code: code.to_string(),
            message: error.to_string(),
        }
    }
}

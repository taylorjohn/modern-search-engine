use std::fmt;
use thiserror::Error;
use warp::reject::Reject;
use serde::Serialize;

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

    #[error("Authentication error: {0}")]
    AuthError(String),

    #[error("Internal server error: {0}")]
    InternalError(anyhow::Error),

    #[error("Database error: {0}")]
    DatabaseError(anyhow::Error),

    #[error("Vector store error: {0}")]
    VectorStoreError(anyhow::Error),
}

impl Reject for ApiError {}

#[derive(Serialize)]
pub struct ErrorResponse {
    pub code: String,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<serde_json::Value>,
}

impl ApiError {
    pub fn to_response(&self) -> ErrorResponse {
        match self {
            ApiError::SearchError(e) => ErrorResponse {
                code: "SEARCH_ERROR".to_string(),
                message: e.to_string(),
                details: None,
            },
            ApiError::ProcessingError(e) => ErrorResponse {
                code: "PROCESSING_ERROR".to_string(),
                message: e.to_string(),
                details: None,
            },
            ApiError::DocumentNotFound(id) => ErrorResponse {
                code: "DOCUMENT_NOT_FOUND".to_string(),
                message: format!("Document not found: {}", id),
                details: None,
            },
            ApiError::InvalidRequest(msg) => ErrorResponse {
                code: "INVALID_REQUEST".to_string(),
                message: msg.clone(),
                details: None,
            },
            ApiError::AuthError(msg) => ErrorResponse {
                code: "AUTH_ERROR".to_string(),
                message: msg.clone(),
                details: None,
            },
            ApiError::InternalError(e) => ErrorResponse {
                code: "INTERNAL_ERROR".to_string(),
                message: "An internal error occurred".to_string(),
                details: Some(serde_json::json!({
                    "error": e.to_string()
                })),
            },
            ApiError::DatabaseError(e) => ErrorResponse {
                code: "DATABASE_ERROR".to_string(),
                message: "Database operation failed".to_string(),
                details: Some(serde_json::json!({
                    "error": e.to_string()
                })),
            },
            ApiError::VectorStoreError(e) => ErrorResponse {
                code: "VECTOR_STORE_ERROR".to_string(),
                message: "Vector store operation failed".to_string(),
                details: Some(serde_json::json!({
                    "error": e.to_string()
                })),
            },
        }
    }
}

pub async fn handle_rejection(err: warp::Rejection) -> Result<impl warp::Reply, std::convert::Infallible> {
    let code;
    let message;
    let details;

    if err.is_not_found() {
        code = warp::http::StatusCode::NOT_FOUND;
        message = "Not Found".to_string();
        details = None;
    } else if let Some(e) = err.find::<ApiError>() {
        let response = e.to_response();
        code = match e {
            ApiError::DocumentNotFound(_) => warp::http::StatusCode::NOT_FOUND,
            ApiError::InvalidRequest(_) => warp::http::StatusCode::BAD_REQUEST,
            ApiError::AuthError(_) => warp::http::StatusCode::UNAUTHORIZED,
            _ => warp::http::StatusCode::INTERNAL_SERVER_ERROR,
        };
        message = response.message;
        details = response.details;
    } else if let Some(e) = err.find::<warp::filters::body::BodyDeserializeError>() {
        code = warp::http::StatusCode::BAD_REQUEST;
        message = e.to_string();
        details = None;
    } else {
        code = warp::http::StatusCode::INTERNAL_SERVER_ERROR;
        message = "Internal Server Error".to_string();
        details = None;
    }

    let json = warp::reply::json(&serde_json::json!({
        "code": code.as_u16(),
        "message": message,
        "details": details
    }));

    Ok(warp::reply::with_status(json, code))
}
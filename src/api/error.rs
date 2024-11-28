// src/api/error.rs

use std::fmt;
use warp::reject::Reject;
use serde::Serialize;

#[derive(Debug)]
pub enum ApiError {
    SearchError(anyhow::Error),
    ProcessingError(anyhow::Error),
    DocumentNotFound(String),
    InvalidRequest(String),
    AuthError(String),
    InternalError(anyhow::Error),
}

impl fmt::Display for ApiError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ApiError::SearchError(e) => write!(f, "Search error: {}", e),
            ApiError::ProcessingError(e) => write!(f, "Processing error: {}", e),
            ApiError::DocumentNotFound(id) => write!(f, "Document not found: {}", id),
            ApiError::InvalidRequest(msg) => write!(f, "Invalid request: {}", msg),
            ApiError::AuthError(msg) => write!(f, "Authentication error: {}", msg),
            ApiError::InternalError(e) => write!(f, "Internal error: {}", e),
        }
    }
}

#[derive(Serialize)]
pub struct ErrorResponse {
    pub code: String,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<serde_json::Value>,
}

impl std::error::Error for ApiError {}
impl Reject for ApiError {}

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
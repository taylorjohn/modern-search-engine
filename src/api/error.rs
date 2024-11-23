// src/api/error.rs

use std::fmt;
use thiserror::Error;
use warp::reject::Reject;
use serde::Serialize;

#[derive(Error, Debug)]
pub enum ApiError {
    #[error("Search error: {0}")]
    Search(#[from] anyhow::Error),

    #[error("Processing error: {0}")]
    Processing(String),

    #[error("Document not found: {0}")]
    DocumentNotFound(String),

    #[error("Invalid request: {0}")]
    InvalidRequest(String),

    #[error("Authentication error: {0}")]
    AuthError(String),

    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("Vector store error: {0}")]
    VectorStore(String),

    #[error("Internal server error")]
    Internal(#[from] Box<dyn std::error::Error + Send + Sync>),
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
            ApiError::Search(e) => ErrorResponse {
                code: "SEARCH_ERROR".into(),
                message: e.to_string(),
                details: None,
            },
            ApiError::Processing(msg) => ErrorResponse {
                code: "PROCESSING_ERROR".into(),
                message: msg.clone(),
                details: None,
            },
            ApiError::DocumentNotFound(id) => ErrorResponse {
                code: "NOT_FOUND".into(),
                message: format!("Document not found: {}", id),
                details: None,
            },
            ApiError::InvalidRequest(msg) => ErrorResponse {
                code: "INVALID_REQUEST".into(),
                message: msg.clone(),
                details: None,
            },
            ApiError::AuthError(msg) => ErrorResponse {
                code: "AUTH_ERROR".into(),
                message: msg.clone(),
                details: None,
            },
            ApiError::Database(e) => ErrorResponse {
                code: "DATABASE_ERROR".into(),
                message: e.to_string(),
                details: None,
            },
            ApiError::VectorStore(msg) => ErrorResponse {
                code: "VECTOR_STORE_ERROR".into(),
                message: msg.clone(),
                details: None,
            },
            ApiError::Internal(e) => ErrorResponse {
                code: "INTERNAL_ERROR".into(),
                message: e.to_string(),
                details: None,
            },
        }
    }
}
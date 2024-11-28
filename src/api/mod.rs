// src/api/mod.rs

pub mod error;
pub mod handlers;
pub mod routes;
pub mod types;

pub use self::error::{ApiError, ErrorResponse, handle_rejection};
pub use self::handlers::{handle_search, handle_document_upload, handle_status_check};
pub use self::types::{SearchRequest, SearchResponse, SearchResult, ApiResponse};
pub use self::routes::create_routes;
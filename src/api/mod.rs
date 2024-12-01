pub mod types;
pub mod routes;
pub mod handlers;
pub mod error;

pub use self::error::{ApiError, ErrorResponse};
pub use self::handlers::{handle_search, handle_document_upload};
pub use self::types::*;

/// API response type alias for common results
pub type ApiResult<T> = Result<T, ApiError>;
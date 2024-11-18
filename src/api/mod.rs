pub mod routes;
pub mod handlers;
pub mod error;

pub use self::error::{ApiError, ErrorResponse};
pub use self::handlers::{handle_search, handle_document_upload, handle_status_check};
pub use self::routes::create_routes;

/// API response type alias for common results
pub type ApiResult<T> = Result<T, ApiError>;
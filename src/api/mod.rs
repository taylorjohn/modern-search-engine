mod error;
mod handlers;
mod routes;

pub use error::{ApiError, ErrorResponse};
pub use handlers::{handle_search, handle_document_upload};
pub use routes::create_routes;

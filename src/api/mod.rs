pub mod error;
pub mod handlers;
pub mod routes;

pub use self::error::ApiError;
pub use crate::document::{Document, DocumentMetadata, DocumentScores, DocumentUpload};
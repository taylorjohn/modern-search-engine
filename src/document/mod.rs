// src/document/mod.rs
mod processor;
mod store;
mod types;

pub use self::types::{Document, DocumentMetadata, DocumentUpload};
pub use self::processor::DocumentProcessor;
pub(crate) use self::store::DocumentStore;

#[derive(Debug, Clone)]
pub enum ProcessingStatus {
    Pending,
    Processing(f32),
    Completed(uuid::Uuid),
    Failed(String),
}
pub mod store;
pub mod types;
pub mod embeddings;

pub use self::store::VectorStore;
pub use self::types::*;
pub use self::embeddings::EmbeddingGenerator;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct VectorDocument {
    pub id: String,
    pub title: String,
    pub content: String,
    pub vector: Vec<f32>,
    pub metadata: VectorMetadata,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, Default)]
pub struct VectorMetadata {
    pub content_hash: String,
    pub dimension: usize,
    pub source: String,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct VectorSearchResult {
    pub id: String,
    pub title: String,
    pub content: String,
    pub score: f32,
}

impl From<&crate::document::Document> for VectorDocument {
    fn from(doc: &crate::document::Document) -> Self {
        Self {
            id: doc.id.clone(),
            title: doc.title.clone(),
            content: doc.content.clone(),
            vector: doc.vector_embedding.clone().unwrap_or_default(),
            metadata: VectorMetadata {
                content_hash: crate::utils::helpers::calculate_hash(&doc.content),
                dimension: doc.vector_embedding.as_ref().map(|v| v.len()).unwrap_or(384),
                source: doc.metadata.source_type.clone(),
            },
        }
    }
}

impl From<VectorMetadata> for crate::document::DocumentMetadata {
    fn from(meta: VectorMetadata) -> Self {
        Self {
            source_type: meta.source.clone(),
            author: None,
            language: None,
            tags: Vec::new(),
            custom_metadata: std::collections::HashMap::new(),
        }
    }
}
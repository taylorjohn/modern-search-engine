pub mod store;
pub use self::store::VectorStore;

#[derive(Debug, Clone)]
pub struct VectorQuery {
    pub embedding: Vec<f32>,
    pub limit: usize,
    pub threshold: f32,
}

#[derive(Debug)]
pub struct VectorMatch {
    pub document_id: String,
    pub score: f32,
}
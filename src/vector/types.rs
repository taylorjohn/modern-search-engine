use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VectorQuery {
    pub embedding: Vec<f32>,
    pub k: usize,
    pub threshold: f32,
}
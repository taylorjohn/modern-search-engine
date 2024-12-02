use serde::{Deserialize, Serialize};
use crate::document::Document;
use anyhow::Result;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VectorStore {
    dimension: usize,
    index_type: String,
    vectors: Vec<VectorEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct VectorEntry {
    id: String,
    vector: Vec<f32>,
    document: Document,  // Store full document
    metadata: VectorMetadata,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VectorMetadata {
    source_type: String,
    dimension: usize,
}

impl VectorStore {
    pub fn new(dimension: usize) -> Self {
        Self {
            dimension,
            index_type: "flat".to_string(),
            vectors: Vec::new(),
        }
    }

    pub async fn add_document(&mut self, doc: &Document) -> Result<()> {
        if let Some(embedding) = &doc.vector_embedding {
            self.vectors.push(VectorEntry {
                id: doc.id.clone(),
                vector: embedding.clone(),
                document: doc.clone(),
                metadata: VectorMetadata {
                    source_type: doc.metadata.source_type.clone(),
                    dimension: self.dimension,
                },
            });
            println!("Added document to vector store: {} - {}", doc.id, doc.title); // Debug logging
        }
        Ok(())
    }

    pub async fn search(&self, query: &[f32], limit: usize) -> Result<Vec<Document>> {
        // Simple cosine similarity search
        let mut results: Vec<(f32, &Document)> = self.vectors.iter()
            .filter_map(|entry| {
                let similarity = cosine_similarity(&entry.vector, query);
                Some((similarity, &entry.document))
            })
            .collect();

        // Sort by similarity
        results.sort_by(|a, b| b.0.partial_cmp(&a.0).unwrap());
        
        // Take top k results
        Ok(results.into_iter()
            .take(limit)
            .map(|(_, doc)| doc.clone())
            .collect())
    }

    pub async fn list_documents(&self) -> Result<Vec<Document>> {
        Ok(self.vectors.iter().map(|entry| entry.document.clone()).collect())
    }
}

fn cosine_similarity(a: &[f32], b: &[f32]) -> f32 {
    let dot_product: f32 = a.iter().zip(b.iter()).map(|(x, y)| x * y).sum();
    let norm_a: f32 = a.iter().map(|x| x * x).sum::<f32>().sqrt();
    let norm_b: f32 = b.iter().map(|x| x * x).sum::<f32>().sqrt();
    
    if norm_a == 0.0 || norm_b == 0.0 {
        0.0
    } else {
        dot_product / (norm_a * norm_b)
    }
}
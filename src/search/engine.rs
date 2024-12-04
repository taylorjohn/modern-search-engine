use crate::config::search::SearchConfig;
use crate::document::{Document, DocumentScores};
use crate::vector::VectorStore;
use anyhow::{Result, Context};
use std::sync::Arc;
use tokio::sync::RwLock;
use chrono::Utc;

pub struct SearchEngine {
    vector_store: Arc<RwLock<VectorStore>>,
    config: SearchConfig,
}

impl SearchEngine {
    pub fn new(vector_store: Arc<RwLock<VectorStore>>, config: SearchConfig) -> Self {
        Self {
            vector_store,
            config,
        }
    }

    pub async fn search(
        &self,
        query: &str,
        limit: Option<usize>,
        offset: Option<usize>
    ) -> Result<Vec<Document>> {
        let vector_store = self.vector_store.read().await;
        let limit = limit.unwrap_or(self.config.max_results);
        
        // TODO: Implement proper query vector generation
        let query_vector = vec![0.0; 384];
        
        let similar_docs = vector_store
            .search_similar(&query_vector, limit as i64)
            .await
            .with_context(|| format!("Failed to search with query: {}", query))?;

        Ok(similar_docs
            .into_iter()
            .skip(offset.unwrap_or(0))
            .take(limit)
            .map(|(id, score)| Document {
                id,
                title: String::new(),
                content: String::new(),
                content_type: String::from("text"),
                metadata: Default::default(),
                vector_embedding: None,
                scores: DocumentScores {
                    text_score: 0.0,
                    vector_score: score,
                    final_score: score,
                },
                highlights: Vec::new(),
                created_at: Utc::now(),
                updated_at: Utc::now(),
            })
            .collect())
    }
}
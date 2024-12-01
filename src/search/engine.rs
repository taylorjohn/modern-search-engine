use anyhow::Result;
use std::sync::Arc;
use tokio::sync::RwLock;
use serde::{Serialize, Deserialize};
use crate::vector::store::VectorStore;
use crate::document::Document;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SearchConfig {
    pub max_results: usize,
    pub min_score: f32,
    pub vector_weight: f32,
    pub text_weight: f32,
}

impl Default for SearchConfig {
    fn default() -> Self {
        Self {
            max_results: 10,
            min_score: 0.1,
            vector_weight: 0.6,
            text_weight: 0.4,
        }
    }
}

pub struct SearchEngine {
    vector_store: Arc<RwLock<VectorStore>>,
    config: SearchConfig,
}

impl SearchEngine {
    pub fn new(vector_store: Arc<RwLock<VectorStore>>, config: SearchConfig) -> Self {
        Self { vector_store, config }
    }

    pub async fn search(
        &self,
        query: &str,
        limit: Option<usize>,
        offset: Option<usize>,
    ) -> Result<Vec<Document>> {
        let vector_store = self.vector_store.read().await;
        let query_embedding = vec![0.1; 384]; // placeholder
        
        let docs = vector_store.search(
            &query_embedding,
            limit.unwrap_or(self.config.max_results),
        ).await?;

        Ok(docs.into_iter().skip(offset.unwrap_or(0)).collect())
    }

    pub async fn index_document(&self, document: &Document) -> Result<()> {
        let mut vector_store = self.vector_store.write().await;
        vector_store.add_document(document).await?;
        Ok(())
    }
}
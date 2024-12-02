use anyhow::Result;
use std::sync::Arc;
use tokio::sync::RwLock;
use crate::vector::store::VectorStore;
use crate::document::Document;
use crate::config::SearchConfig;

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
        _query: &str,
        limit: Option<usize>,
        offset: Option<usize>,
    ) -> Result<Vec<Document>> {
        let vector_store = self.vector_store.read().await;
        let query_embedding = vec![0.1; self.config.vector.dimension]; // Mock embedding
        
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
use anyhow::Result;
use std::sync::Arc;
use tokio::sync::RwLock;
use crate::config::Config;
use crate::search::types::{SearchResult, SearchScores, SearchMetadata};
use crate::vector::VectorStore;

pub struct SearchEngine {
    vector_store: Arc<RwLock<VectorStore>>,
    config: Config,
}

impl SearchEngine {
    pub fn new(vector_store: Arc<RwLock<VectorStore>>, config: Config) -> Self {
        Self {
            vector_store,
            config,
        }
    }

    pub async fn search(
        &self,
        query: &str,
        limit: Option<usize>,
        offset: Option<usize>,
    ) -> Result<Vec<SearchResult>> {
        let vector_store = self.vector_store.read().await;
        let vec_results = vector_store.search(query.as_bytes(), limit.unwrap_or(10)).await?;

        Ok(vec_results.into_iter()
            .map(|doc| SearchResult {
                id: doc.id.to_string(),
                title: doc.metadata.title,
                content: String::new(), // You would need to fetch this from your document store
                scores: SearchScores {
                    text_score: 0.0,
                    vector_score: doc.score,
                    final_score: doc.score,
                },
                metadata: SearchMetadata {
                    source_type: doc.metadata.source.clone(),
                    content_type: "text".to_string(),
                    author: None,
                    created_at: Utc::now(),
                    last_modified: Utc::now(),
                    word_count: 0,
                    tags: vec![],
                    custom_metadata: HashMap::new(),
                },
                highlights: vec![],
            })
            .collect())
    }
}
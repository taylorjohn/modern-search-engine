use crate::vector::store::VectorStore;
use crate::search::{SearchResult, SearchScores, SearchMetadata};
use anyhow::Result;
use std::sync::Arc;
use tokio::sync::RwLock;

pub struct SearchEngine {
    vector_store: Arc<RwLock<VectorStore>>,
    config: SearchConfig,
}

#[derive(Clone)]
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
        offset: Option<usize>,
    ) -> Result<Vec<SearchResult>> {
        let limit = limit.unwrap_or(self.config.max_results);
        let offset = offset.unwrap_or(0);

        // Generate query embedding
        let vector_store = self.vector_store.read().await;
        let query_embedding = vector_store.generate_embedding(query).await?;

        // Perform vector search
        let vector_results = vector_store
            .search(&query_embedding, limit, self.config.min_score)
            .await?;

        // Convert to search results
        let results = vector_results
            .into_iter()
            .map(|doc| SearchResult {
                id: doc.id,
                title: doc.title,
                content: doc.content,
                scores: SearchScores {
                    text_score: 0.0, // TODO: Implement text scoring
                    vector_score: doc.score,
                    final_score: doc.score,
                },
                metadata: SearchMetadata {
                    source_type: doc.metadata.source_type,
                    author: doc.metadata.author,
                    created_at: doc.metadata.created_at,
                    word_count: doc.content.split_whitespace().count(),
                },
            })
            .collect();

        Ok(results)
    }

    pub async fn get_document(&self, id: &str) -> Result<Option<SearchResult>> {
        let vector_store = self.vector_store.read().await;
        let doc = vector_store.get_document(id).await?;

        Ok(doc.map(|doc| SearchResult {
            id: doc.id,
            title: doc.title,
            content: doc.content,
            scores: SearchScores {
                text_score: 0.0,
                vector_score: 0.0,
                final_score: 0.0,
            },
            metadata: SearchMetadata {
                source_type: doc.metadata.source_type,
                author: doc.metadata.author,
                created_at: doc.metadata.created_at,
                word_count: doc.content.split_whitespace().count(),
            },
        }))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_search() {
        // TODO: Add tests
    }

    #[tokio::test]
    async fn test_get_document() {
        // TODO: Add tests
    }
}
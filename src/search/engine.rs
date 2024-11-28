use crate::search::types::{
    SearchResult, SearchScores, SearchMetadata, SearchOptions,
    SearchResponse, SearchType, SearchAnalytics, QueryInfo
};
use crate::vector::store::VectorStore;
use anyhow::Result;
use std::sync::Arc;
use tokio::sync::RwLock;
use uuid::Uuid;

pub struct SearchEngine {
    vector_store: Arc<RwLock<VectorStore>>,
    options: SearchOptions,
}

impl SearchEngine {
    pub fn new(vector_store: Arc<RwLock<VectorStore>>, options: SearchOptions) -> Self {
        Self {
            vector_store,
            options,
        }
    }

    pub async fn search(
        &self,
        query: &str,
        limit: Option<usize>,
        offset: Option<usize>,
    ) -> Result<SearchResponse> {
        let start_time = std::time::Instant::now();
        let limit = limit.unwrap_or(10);
        let offset = offset.unwrap_or(0);

        let vector_store = self.vector_store.read().await;
        
        // Generate query embedding for vector search
        let query_embedding = if self.options.use_vector {
            Some(vector_store.generate_embedding(query).await?)
        } else {
            None
        };

        // Perform search based on options
        let results = match (query_embedding, self.options.use_vector) {
            (Some(embedding), true) => {
                // Vector search
                vector_store.search(&embedding, limit).await?
            },
            _ => {
                // Text-only search
                vector_store.text_search(query, limit, offset).await?
            }
        };

        let mut search_results = Vec::new();
        for doc in results {
            let search_scores = SearchScores {
                text_score: doc.scores.text_score,
                vector_score: doc.scores.vector_score,
                final_score: doc.scores.final_score,
            };

            let metadata = SearchMetadata {
                source_type: doc.metadata.source_type,
                author: doc.metadata.author,
                created_at: doc.metadata.created_at,
                last_modified: doc.metadata.last_modified,
                word_count: doc.content.split_whitespace().count(),
                tags: doc.metadata.tags,
                content_type: doc.metadata.content_type,
                custom_metadata: doc.metadata.custom_metadata.into_iter()
                    .map(|(k, v)| (k, serde_json::Value::String(v)))
                    .collect(),
            };

            search_results.push(SearchResult {
                id: doc.id,  // Already a Uuid
                title: doc.title,
                content: doc.content,
                scores: search_scores,
                metadata,
                highlights: Vec::new(), // TODO: Implement highlighting
            });
        }

        let execution_time = start_time.elapsed();
        let analytics = SearchAnalytics {
            execution_time_ms: execution_time.as_millis() as u64,
            total_results: search_results.len(),
            max_score: search_results.first()
                .map(|r| r.scores.final_score)
                .unwrap_or(0.0),
            search_type: if self.options.use_vector {
                SearchType::Hybrid
            } else {
                SearchType::Text
            },
            vector_query: self.options.use_vector,
            field_weights: Some(self.options.field_weights.clone()),
        };

        Ok(SearchResponse {
            query: QueryInfo {
                original: query.to_string(),
                expanded: query.to_string(), // TODO: Implement query expansion
                vector_query: self.options.use_vector,
            },
            results: search_results,
            analytics,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::search::types::SearchOptions;

    #[tokio::test]
    async fn test_basic_search() {
        let vector_store = Arc::new(RwLock::new(VectorStore::new().await.unwrap()));
        let options = SearchOptions {
            use_vector: true,
            min_score: 0.1,
            field_weights: Default::default(),
        };

        let engine = SearchEngine::new(vector_store, options);
        let results = engine.search("test", Some(10), None).await.unwrap();
        assert!(results.results.is_empty()); // Empty because no documents indexed
    }
}
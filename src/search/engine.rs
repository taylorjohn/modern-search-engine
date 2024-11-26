// src/search/engine.rs

use crate::search::types::{
    SearchResult, SearchScores, SearchMetadata, SearchOptions,
    SearchResponse, SearchType, SearchAnalytics, QueryInfo
};
use crate::vector::store::VectorStore;
use anyhow::{Result, Context};
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
        let results = if self.options.use_vector {
            vector_store
                .search(query, limit, self.options.min_score)
                .await?
        } else {
            vector_store
                .text_search(query, limit, offset)
                .await?
        };

        let mut search_results = Vec::new();
        for doc in results {
            // Convert document to search result
            let search_scores = SearchScores {
                text_score: doc.text_score.unwrap_or(0.0),
                vector_score: doc.vector_score.unwrap_or(0.0),
                final_score: doc.final_score,
            };

            let metadata = SearchMetadata {
                source_type: doc.metadata.source_type,
                content_type: doc.content_type,
                author: doc.metadata.author,
                created_at: doc.metadata.created_at,
                last_modified: doc.metadata.last_modified,
                word_count: doc.content.split_whitespace().count(),
                tags: doc.metadata.tags,
                custom_metadata: doc.metadata.custom_metadata.into_iter()
                    .map(|(k, v)| (k, serde_json::Value::String(v.to_string())))
                    .collect(),
            };

            search_results.push(SearchResult {
                id: Uuid::parse_str(&doc.id).unwrap_or_default(),
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

    #[tokio::test]
    async fn test_basic_search() {
        // TODO: Add tests
    }
}
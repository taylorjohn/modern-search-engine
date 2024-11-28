use crate::search::types::{
    SearchDocumentResult, SearchScores, SearchMetadata, SearchOptions,
    SearchResponse, SearchType, SearchAnalytics, QueryInfo, TimingBreakdown,
    SearchResult
};
use crate::vector::store::VectorStore;
use anyhow::{Result, Context};
use std::sync::Arc;
use tokio::sync::RwLock;
use std::time::Instant;

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
    ) -> SearchResult<SearchResponse> {
        let start_time = Instant::now();
        let limit = limit.unwrap_or(10);
        let offset = offset.unwrap_or(0);

        let timing = TimingBreakdown {
            query_parsing_ms: 0,
            vector_search_ms: 0,
            text_search_ms: 0,
            scoring_ms: 0,
        };

        let vector_store = self.vector_store.read().await;
        
        let (results, search_type) = if self.options.use_vector {
            let embedding_start = Instant::now();
            let embedding = vector_store.generate_embedding(query).await
                .context("Failed to generate embedding")?;
            let embedding_time = embedding_start.elapsed().as_millis() as u64;

            let search_start = Instant::now();
            let results = vector_store.search(&embedding, limit).await
                .context("Vector search failed")?;
            let search_time = search_start.elapsed().as_millis() as u64;

            (results, SearchType::Hybrid)
        } else {
            let search_start = Instant::now();
            let results = vector_store.text_search(query, limit, offset).await
                .context("Text search failed")?;
            let search_time = search_start.elapsed().as_millis() as u64;

            (results, SearchType::Text)
        };

        let search_results: Vec<SearchDocumentResult> = results.into_iter()
            .map(|doc| SearchDocumentResult {
                id: doc.id,
                title: doc.title,
                content: doc.content,
                scores: SearchScores {
                    text_score: doc.scores.text_score,
                    vector_score: doc.scores.vector_score,
                    final_score: doc.scores.final_score,
                },
                metadata: doc.metadata,
                highlights: Vec::new(), // TODO: Implement highlighting
            })
            .collect();

        let execution_time = start_time.elapsed();
        
        let analytics = SearchAnalytics {
            execution_time_ms: execution_time.as_millis() as u64,
            total_results: search_results.len(),
            max_score: search_results.first()
                .map(|r| r.scores.final_score)
                .unwrap_or(0.0),
            search_type,
            vector_query: self.options.use_vector,
            field_weights: Some(self.options.field_weights.clone()),
            timing_breakdown: Some(timing),
        };

        Ok(SearchResponse {
            query: QueryInfo {
                original: query.to_string(),
                expanded: query.to_string(), // TODO: Implement query expansion
                vector_query: self.options.use_vector,
                embedding: None,
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
    use std::collections::HashMap;

    #[tokio::test]
    async fn test_basic_search() -> Result<()> {
        let pool = sqlx::postgres::PgPoolOptions::new()
            .max_connections(5)
            .connect("postgres://localhost/test_db")
            .await?;

        let vector_store = Arc::new(RwLock::new(VectorStore::new(pool, 384).await?));
        let options = SearchOptions {
            use_vector: true,
            field_weights: HashMap::new(),
            min_score: 0.1,
        };

        let engine = SearchEngine::new(vector_store, options);
        let results = engine.search("test", Some(10), None).await?;
        assert!(results.results.is_empty()); // Empty because no documents indexed
        Ok(())
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
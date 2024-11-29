// src/search/engine.rs
use std::sync::Arc;
use tokio::sync::RwLock;
use anyhow::Result;
use sqlx::types::Uuid;

use crate::vector::store::VectorStore;
use crate::config::SearchConfig;

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

    pub async fn search(&self, query: &str, limit: Option<usize>) -> Result<Vec<SearchResult>> {
        let limit = limit.unwrap_or(self.config.max_results);
        let vector_store = self.vector_store.read().await;

        if self.config.use_vector {
            // Generate vector for query
            let embedding = generate_embedding(query).await?;
            
            // Search by vector similarity
            let results = vector_store.search(&embedding, limit as i64).await?;
            
            Ok(results.into_iter()
                .map(|(id, score)| SearchResult { id, score })
                .collect())
        } else {
            // Fallback to text search
            let results = sqlx::query_as!(
                SearchResult,
                r#"
                SELECT 
                    id,
                    ts_rank_cd(to_tsvector('english', content), plainto_tsquery('english', $1)) as "score!",
                    title,
                    content 
                FROM documents
                WHERE to_tsvector('english', content) @@ plainto_tsquery('english', $1)
                ORDER BY score DESC
                LIMIT $2
                "#,
                query,
                limit as i64
            )
            .fetch_all(&vector_store.pool)
            .await?;

            Ok(results)
        }
    }
}

#[derive(sqlx::FromRow)]
pub struct SearchResult {
    pub id: Uuid,
    pub score: f32,
    pub title: String,
    pub content: String,
}

async fn generate_embedding(text: &str) -> Result<Vec<f32>> {
    // Implement vector embedding generation
    // For now return dummy vector
    Ok(vec![0.0; 384])
}
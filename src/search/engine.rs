use crate::document::{Document, DocumentScores};
use crate::vector::VectorStore;
use crate::config::search::SearchConfig;
use anyhow::Result;
use std::sync::Arc;
use tokio::sync::RwLock;
use chrono::Utc;
use sqlx::PgPool;
use tracing::info;

pub struct SearchEngine {
    vector_store: Arc<RwLock<VectorStore>>,
    pool: Arc<PgPool>,
    config: SearchConfig,
}

impl SearchEngine {
    pub fn new(vector_store: Arc<RwLock<VectorStore>>, pool: Arc<PgPool>, config: SearchConfig) -> Self {
        Self {
            vector_store,
            pool,
            config,
        }
    }

    pub async fn search(
        &self,
        query: &str,
        limit: Option<usize>,
        offset: Option<usize>
    ) -> Result<Vec<Document>> {
        let limit = limit.unwrap_or(self.config.max_results);
        let offset = offset.unwrap_or(0);
        
        // Format query for tsquery
        let formatted_query = query.split_whitespace().collect::<Vec<_>>().join(" & ");
        info!("Formatted query: {}", formatted_query);
        
        let text_results = sqlx::query!(
            r#"
            SELECT 
                id::text,
                title,
                content,
                content_type,
                metadata,
                ts_rank_cd(
                    setweight(to_tsvector('english', title), 'A') ||
                    setweight(to_tsvector('english', content), 'B'),
                    to_tsquery('english', $1)
                ) as rank
            FROM documents
            WHERE 
                to_tsvector('english', title) @@ to_tsquery('english', $1) OR
                to_tsvector('english', content) @@ to_tsquery('english', $1)
            ORDER BY rank DESC
            LIMIT $2
            OFFSET $3
            "#,
            formatted_query,
            limit as i64,
            offset as i64
        )
        .fetch_all(&*self.pool)
        .await?;

        info!("Found {} results", text_results.len());

        let mut documents = Vec::new();
        for row in text_results {
            let metadata = row.metadata.unwrap_or_default();
            let rank = row.rank.unwrap_or_default();
            
            documents.push(Document {
                id: row.id.unwrap_or_default(),
                title: row.title,
                content: row.content,
                content_type: row.content_type,
                metadata: serde_json::from_value(metadata).unwrap_or_default(),
                vector_embedding: None,
                scores: DocumentScores {
                    text_score: rank as f32,
                    vector_score: 0.0,
                    final_score: rank as f32,
                },
                highlights: vec![],
                created_at: Utc::now(),
                updated_at: Utc::now(),
            });
        }

        info!("Returning {} documents", documents.len());
        Ok(documents)
    }
}
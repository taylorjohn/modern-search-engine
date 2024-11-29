use anyhow::Result;
use sqlx::PgPool;
use crate::search::{SearchResult, SearchConfig};
use crate::document::Document;

pub struct SearchExecutor {
    pool: PgPool,
    config: SearchConfig,
}

impl SearchExecutor {
    pub fn new(pool: PgPool, config: SearchConfig) -> Self {
        Self { pool, config }
    }

    pub async fn search(&self, query: &str, limit: usize) -> Result<Vec<SearchResult>> {
        let records = sqlx::query_as!(
            Document,
            r#"
            WITH ranked_docs AS (
                SELECT 
                    *,
                    ts_rank(to_tsvector('english', content), plainto_tsquery($1)) as rank
                FROM documents
                WHERE to_tsvector('english', content) @@ plainto_tsquery($1)
            )
            SELECT * FROM ranked_docs
            ORDER BY rank DESC
            LIMIT $2
            "#,
            query,
            limit as i64
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(records.into_iter()
            .map(|doc| SearchResult::from_document(doc, 1.0))
            .collect())
    }
}

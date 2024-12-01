use anyhow::Result;
use crate::document::Document;
use sqlx::PgPool;
use uuid::Uuid;
use serde_json::Value;

pub struct SearchExecutor {
    pool: PgPool,
}

impl SearchExecutor {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn search(&self, query: &str, limit: usize) -> Result<Vec<Document>> {
        let records = sqlx::query!(
            r#"
            WITH ranked_docs AS (
                SELECT 
                    id as "id!: Uuid",
                    title,
                    content,
                    content_type,
                    vector_embedding as "vector_embedding?: Vec<f64>",
                    metadata as "metadata!: Value",
                    created_at,
                    updated_at,
                    ts_rank_cd(to_tsvector('english', content), plainto_tsquery($1)) as rank
                FROM documents
                WHERE 
                    to_tsvector('english', content) @@ plainto_tsquery($1)
                ORDER BY rank DESC
                LIMIT $2
            )
            SELECT * FROM ranked_docs
            "#,
            query,
            limit as i64
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(records
            .into_iter()
            .map(|r| Document {
                id: r.id.to_string(),
                title: r.title,
                content: r.content,
                content_type: r.content_type,
                metadata: serde_json::from_value(r.metadata).unwrap_or_default(),
                vector_embedding: r.vector_embedding
                    .map(|v| v.into_iter().map(|x| x as f32).collect()),
                created_at: r.created_at,
                updated_at: r.updated_at,
            })
            .collect())
    }
}
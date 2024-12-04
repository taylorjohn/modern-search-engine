use anyhow::Result;
use crate::document::{Document, DocumentScores};
use sqlx::PgPool;
use chrono::Utc;

pub struct SearchExecutor {
    pool: PgPool,
}

impl SearchExecutor {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn search(&self, query: &str, limit: i64) -> Result<Vec<Document>> {
        let records = sqlx::query!(
            r#"
            WITH SearchResults AS (
                SELECT 
                    id, 
                    title, 
                    content, 
                    content_type,
                    metadata,
                    created_at,
                    updated_at,
                    ts_rank_cd(
                        setweight(to_tsvector('english', title), 'A') || 
                        setweight(to_tsvector('english', content), 'B'),
                        plainto_tsquery('english', $1)
                    )::float8 as text_similarity
                FROM documents
                WHERE 
                    to_tsvector('english', content) @@ plainto_tsquery('english', $1) OR
                    to_tsvector('english', title) @@ plainto_tsquery('english', $1)
            )
            SELECT * FROM SearchResults
            ORDER BY text_similarity DESC
            LIMIT $2
            "#,
            query,
            limit
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
                vector_embedding: None,
                metadata: serde_json::from_value(r.metadata.unwrap_or_default()).unwrap_or_default(),
                highlights: vec![],
                scores: DocumentScores {
                    text_score: r.text_similarity.unwrap_or(0.0) as f32,
                    vector_score: 0.0,
                    final_score: r.text_similarity.unwrap_or(0.0) as f32,
                },
                created_at: r.created_at.unwrap_or_else(|| Utc::now()),
                updated_at: r.updated_at.unwrap_or_else(|| Utc::now()),
            })
            .collect())
    }
}
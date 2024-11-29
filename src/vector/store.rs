// src/vector/store.rs
use sqlx::PgPool;
use sqlx::types::Uuid;
use anyhow::Result;

pub struct VectorStore {
    pool: PgPool,
}

impl VectorStore {
    pub async fn new(pool: PgPool) -> Result<Self> {
        Ok(Self { pool })
    }

    pub async fn add_document(&self, id: Uuid, vector: &[f32]) -> Result<()> {
        sqlx::query!(
            r#"
            UPDATE documents 
            SET vector_embedding = $1::vector
            WHERE id = $2
            "#,
            vector as _,
            id,
        )
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn search(&self, query_vector: &[f32], limit: i64) -> Result<Vec<(Uuid, f32)>> {
        let results = sqlx::query!(
            r#"
            SELECT id, 1 - (vector_embedding <=> $1::vector) as score 
            FROM documents
            WHERE vector_embedding IS NOT NULL
            ORDER BY vector_embedding <=> $1::vector
            LIMIT $2
            "#,
            query_vector as _,
            limit
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(results.into_iter()
            .map(|r| (r.id, r.score.unwrap_or(0.0)))
            .collect())
    }
}
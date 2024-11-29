use anyhow::Result;
use sqlx::PgPool;
use crate::vector::types::{VectorDocument, VectorMetadata};

pub struct VectorStore {
    pool: PgPool,
    dimension: usize,
}

impl VectorStore {
    pub async fn new(pool: PgPool, dimension: usize) -> Result<Self> {
        Ok(Self { pool, dimension })
    }

    pub async fn add_document(&self, doc: &VectorDocument) -> Result<()> {
        sqlx::query!(
            r#"
            UPDATE documents 
            SET vector_embedding = $2::float4[]
            WHERE id = $1
            "#,
            doc.id,
            &doc.vector as &[f32]
        )
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn search(&self, query_vec: &[f32], limit: usize) -> Result<Vec<VectorDocument>> {
        let results = sqlx::query!(
            r#"
            SELECT 
                d.id,
                d.title,
                d.content_type,
                d.vector_embedding as "vector_embedding!: Vec<f32>",
                (1 - (d.vector_embedding <=> $1::float4[])) as similarity
            FROM documents d
            WHERE d.vector_embedding IS NOT NULL
            ORDER BY d.vector_embedding <=> $1::float4[]
            LIMIT $2
            "#,
            query_vec as &[f32],
            limit as i64
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(results
            .into_iter()
            .map(|r| VectorDocument {
                id: r.id,
                vector: r.vector_embedding,
                metadata: VectorMetadata {
                    title: r.title,
                    content_hash: String::new(),
                    dimension: self.dimension,
                    source: r.content_type,
                },
                score: r.similarity.unwrap_or(0.0) as f32,
            })
            .collect())
    }
}
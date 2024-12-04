use crate::document::Document;
use anyhow::Result;
use sqlx::PgPool;
use std::sync::Arc;
use uuid::Uuid;

pub struct VectorStore {
    pool: Arc<PgPool>,
    dimension: usize,
}

impl VectorStore {
    pub fn new(pool: Arc<PgPool>, dimension: usize) -> Self {
        Self { pool, dimension }
    }

    pub async fn add_document(&self, doc: &Document) -> Result<()> {
        if let Some(embedding) = &doc.vector_embedding {
            if embedding.len() != self.dimension {
                anyhow::bail!("Invalid embedding dimension");
            }
            
            sqlx::query!(
                r#"
                UPDATE documents 
                SET vector_embedding = $1::float8[]::vector
                WHERE id = $2
                "#,
                &embedding[..] as _,
                Uuid::parse_str(&doc.id)?,
            )
            .execute(&*self.pool)
            .await?;
        }
        Ok(())
    }

    pub async fn search_similar(&self, query_vector: &[f32], limit: i64) -> Result<Vec<(String, f32)>> {
        if query_vector.len() != self.dimension {
            anyhow::bail!("Invalid query vector dimension");
        }

        let records = sqlx::query!(
            r#"
            SELECT id::text, 
                   (1 - (vector_embedding <=> $1::float8[]::vector))::float8 as similarity
            FROM documents
            WHERE vector_embedding IS NOT NULL
            ORDER BY vector_embedding <=> $1::float8[]::vector
            LIMIT $2
            "#,
            &query_vector.iter().map(|&x| x as f64).collect::<Vec<f64>>(),
            limit
        )
        .fetch_all(&*self.pool)
        .await?;

        Ok(records
            .into_iter()
            .filter_map(|r| {
                Some((r.id.unwrap_or_default(), r.similarity.unwrap_or_default() as f32))
            })
            .collect())
    }
}
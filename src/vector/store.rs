use crate::search::types::{DocumentSearchResult, SearchResult, SearchScores, SearchMetadata};
use anyhow::{Result, Context};
use sqlx::PgPool;
use std::collections::HashMap;
use uuid::Uuid;

pub struct VectorStore {
    pool: PgPool,
    dimension: usize,
}

impl VectorStore {
    pub async fn new(pool: PgPool, dimension: usize) -> Result<Self> {
        // Run each extension setup separately
        sqlx::query!("CREATE EXTENSION IF NOT EXISTS vector;")
            .execute(&pool)
            .await
            .context("Failed to create vector extension")?;

        sqlx::query!("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";")
            .execute(&pool)
            .await
            .context("Failed to create uuid extension")?;

        // Create vector similarity function
        sqlx::query!(
            r#"
            CREATE OR REPLACE FUNCTION vector_similarity(a float4[], b float4[])
            RETURNS float8 AS $$
            SELECT 1 - (a::vector <=> b::vector)
            $$ LANGUAGE SQL IMMUTABLE STRICT;
            "#
        )
        .execute(&pool)
        .await
        .context("Failed to create similarity function")?;

        Ok(Self { pool, dimension })
    }

    pub async fn add_vector(&self, doc_id: Uuid, embedding: Vec<f32>) -> Result<()> {
        sqlx::query!(
            r#"
            UPDATE documents 
            SET vector_embedding = $1::float4[]
            WHERE id = $2
            "#,
            &embedding[..] as &[f32],
            doc_id,
        )
        .execute(&self.pool)
        .await
        .context("Failed to update document vector")?;

        Ok(())
    }

    pub async fn search(&self, query_vector: &[f32], limit: usize) -> SearchResult<Vec<DocumentSearchResult>> {
        let results = sqlx::query!(
            r#"
            SELECT 
                d.id,
                d.title,
                d.content,
                d.content_type,
                d.metadata,
                d.created_at,
                d.updated_at,
                vector_similarity(d.vector_embedding::float4[], $1::float4[]) as similarity
            FROM documents d
            WHERE d.vector_embedding IS NOT NULL
            ORDER BY similarity DESC
            LIMIT $2
            "#,
            query_vector as &[f32],
            limit as i64
        )
        .fetch_all(&self.pool)
        .await
        .map_err(SearchError::DatabaseError)?;

        let documents = results.into_iter()
            .map(|row| {
                Ok(DocumentSearchResult {
                    id: row.id,
                    title: row.title,
                    content: row.content,
                    scores: SearchScores {
                        text_score: 0.0,
                        vector_score: row.similarity.unwrap_or(0.0) as f32,
                        final_score: row.similarity.unwrap_or(0.0) as f32,
                    },
                    metadata: SearchMetadata {
                        source_type: "document".to_string(),
                        content_type: row.content_type,
                        author: None,
                        created_at: row.created_at,
                        last_modified: row.updated_at,
                        word_count: row.content.split_whitespace().count(),
                        tags: Vec::new(),
                        custom_metadata: HashMap::new(),
                    },
                    highlights: Vec::new(),
                })
            })
            .collect::<SearchResult<Vec<_>>>()?;

        Ok(documents)
    }
}
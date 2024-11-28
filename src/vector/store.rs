use crate::search::types::{SearchResult, SearchScores, SearchMetadata};
use crate::document::Document;
use anyhow::{Result, Context};
use sqlx::PgPool;

pub struct VectorStore {
    pool: PgPool,
    dimension: usize,
}

impl VectorStore {
    pub async fn new(pool: PgPool, dimension: usize) -> Result<Self> {
        // Initialize extensions sequentially
        sqlx::query!(r#"DO $$ BEGIN CREATE EXTENSION IF NOT EXISTS vector; EXCEPTION WHEN OTHERS THEN NULL; END $$"#)
            .execute(&pool)
            .await
            .context("Failed to create vector extension")?;

        sqlx::query!(r#"DO $$ BEGIN CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; EXCEPTION WHEN OTHERS THEN NULL; END $$"#)
            .execute(&pool)
            .await
            .context("Failed to create UUID extension")?;

        sqlx::query!(
            r#"
            CREATE OR REPLACE FUNCTION vector_cosine_similarity(a vector, b vector) 
            RETURNS float8 AS $$
            SELECT 1 - (a <=> b)::float8;
            $$ LANGUAGE SQL IMMUTABLE STRICT PARALLEL SAFE;
            "#
        )
        .execute(&pool)
        .await
        .context("Failed to create similarity function")?;

        Ok(Self { pool, dimension })
    }
}

    pub async fn generate_embedding(&self, _text: &str) -> Result<Vec<f32>> {
        // TODO: Implement actual embedding generation
        Ok(vec![0.1; self.dimension])
    }

    pub async fn add_document(&self, doc: &Document) -> Result<()> {
        if let Some(embedding) = &doc.vector_embedding {
            if embedding.len() != self.dimension {
                return Err(anyhow::anyhow!(
                    "Vector dimension mismatch: expected {}, got {}",
                    self.dimension,
                    embedding.len()
                ));
            }

            sqlx::query!(
                r#"
                UPDATE documents 
                SET vector_embedding = $1::float4[]
                WHERE id = $2
                "#,
                embedding.as_slice(),
                doc.id,
            )
            .execute(&self.pool)
            .await
            .context("Failed to update document vector")?;
        }
        Ok(())
    }

    pub async fn search(&self, query_vector: &[f32], limit: usize) -> Result<Vec<SearchResult>> {
        sqlx::query!(
            r#"
            SELECT 
                d.id,
                d.title,
                d.content,
                d.content_type,
                d.metadata,
                d.created_at,
                d.updated_at,
                1 - (d.vector_embedding::float4[] <=> $1::float4[]) as similarity
            FROM documents d
            WHERE d.vector_embedding IS NOT NULL
            ORDER BY d.vector_embedding::float4[] <=> $1::float4[]
            LIMIT $2
            "#,
            query_vector as &[f32],
            limit as i64
        )
        .fetch_all(&self.pool)
        .await?
        .into_iter()
        .map(|r| {
            let metadata = serde_json::from_value(r.metadata.unwrap_or_default())
                .unwrap_or_default();
            
            Ok(SearchResult {
                id: r.id,
                title: r.title,
                content: r.content,
                scores: SearchScores {
                    text_score: 0.0,
                    vector_score: r.similarity.unwrap_or(0.0) as f32,
                    final_score: r.similarity.unwrap_or(0.0) as f32,
                },
                metadata: SearchMetadata {
                    source_type: "document".to_string(),
                    content_type: r.content_type,
                    author: None,
                    created_at: r.created_at,
                    last_modified: r.updated_at,
                    word_count: r.content.split_whitespace().count(),
                    tags: Vec::new(),
                    custom_metadata: serde_json::Map::new(),
                },
                highlights: Vec::new(),
            })
        })
        .collect()
    }

    pub async fn text_search(&self, query: &str, limit: usize, offset: usize) -> Result<Vec<SearchResult>> {
        sqlx::query!(
            r#"
            SELECT 
                d.id,
                d.title,
                d.content,
                d.content_type,
                d.metadata,
                d.created_at,
                d.updated_at,
                ts_rank(to_tsvector('english', d.content), plainto_tsquery('english', $1)) as rank
            FROM documents d
            WHERE to_tsvector('english', d.content) @@ plainto_tsquery('english', $1)
            ORDER BY rank DESC
            LIMIT $2
            OFFSET $3
            "#,
            query,
            limit as i64,
            offset as i64
        )
        .fetch_all(&self.pool)
        .await?
        .into_iter()
        .map(|r| {
            let metadata = serde_json::from_value(r.metadata.unwrap_or_default())
                .unwrap_or_default();
            
            Ok(SearchResult {
                id: r.id,
                title: r.title,
                content: r.content,
                scores: SearchScores {
                    text_score: r.rank.unwrap_or(0.0) as f32,
                    vector_score: 0.0,
                    final_score: r.rank.unwrap_or(0.0) as f32,
                },
                metadata: SearchMetadata {
                    source_type: "document".to_string(),
                    content_type: r.content_type,
                    author: None,
                    created_at: r.created_at,
                    last_modified: r.updated_at,
                    word_count: r.content.split_whitespace().count(),
                    tags: Vec::new(),
                    custom_metadata: serde_json::Map::new(),
                },
                highlights: Vec::new(),
            })
        })
        .collect()
    }

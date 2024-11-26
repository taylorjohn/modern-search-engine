// src/vector/store.rs
use crate::search::types::{SearchResult, SearchScores, SearchMetadata};
use crate::document::Document;
use anyhow::{Result, Context};
use sqlx::PgPool;
use uuid::Uuid;
use std::collections::HashMap;
use chrono::Utc;

pub struct VectorStore {
    pool: PgPool,
    dimension: usize,
}

impl VectorStore {
    pub async fn new(pool: PgPool, dimension: usize) -> Result<Self> {
        // Verify vector extension is enabled
        sqlx::query!("CREATE EXTENSION IF NOT EXISTS vector")
            .execute(&pool)
            .await?;

        Ok(Self { pool, dimension })
    }

    pub async fn generate_embedding(&self, text: &str) -> Result<Vec<f32>> {
        // TODO: Implement actual embedding generation
        // For now, return a dummy vector of the correct dimension
        Ok(vec![0.1; self.dimension])
    }

    pub async fn add_document(&self, doc: &Document) -> Result<()> {
        if let Some(embedding) = &doc.vector_embedding {
            sqlx::query!(
                r#"
                UPDATE documents 
                SET vector_embedding = $1::vector
                WHERE id = $2
                "#,
                &embedding[..] as &[f32],
                doc.id,
            )
            .execute(&self.pool)
            .await
            .context("Failed to update document vector")?;
        }
        Ok(())
    }

    pub async fn search(&self, query_vector: &[f32], limit: usize) -> Result<Vec<SearchResult>> {
        let results = sqlx::query!(
            r#"
            SELECT 
                d.id,
                d.title,
                d.content,
                d.content_type,
                d.metadata,
                d.author,
                d.created_at,
                d.updated_at,
                1 - (d.vector_embedding <-> $1::vector(384)) as similarity
            FROM documents d
            WHERE d.vector_embedding IS NOT NULL
            ORDER BY d.vector_embedding <-> $1::vector(384)
            LIMIT $2
            "#,
            query_vector as &[f32],
            limit as i64
        )
        .fetch_all(&self.pool)
        .await?;

        let mut search_results = Vec::new();
        for r in results {
            let content = r.content.clone();
            search_results.push(SearchResult {
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
                    author: r.author,
                    created_at: r.created_at,
                    last_modified: r.updated_at,
                    word_count: content.split_whitespace().count(),
                    tags: Vec::new(),
                    custom_metadata: r.metadata
                        .map(|m| serde_json::from_value(m).unwrap_or_default())
                        .unwrap_or_default(),
                },
                highlights: Vec::new(),
            });
        }

        Ok(search_results)
    }
}
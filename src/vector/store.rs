// src/vector/store.rs

use crate::search::types::{SearchResult, SearchScores, SearchMetadata};
use crate::document::Document;
use anyhow::Result;
use sqlx::PgPool;
use ndarray::Array1;
use uuid::Uuid;
use std::collections::HashMap;

pub struct VectorStore {
    pool: PgPool,
    dimension: usize,
    similarity_threshold: f32,
}

impl VectorStore {
    pub async fn new(pool: PgPool, dimension: usize) -> Result<Self> {
        Ok(Self {
            pool,
            dimension,
            similarity_threshold: 0.7,
        })
    }

    pub async fn add_document(&self, doc: &Document) -> Result<()> {
        if let Some(embedding) = &doc.vector_embedding {
            let embedding: Vec<f64> = embedding.iter().map(|&x| x as f64).collect();
            
            sqlx::query!(
                r#"
                UPDATE documents 
                SET vector_embedding = $1
                WHERE id = $2
                "#,
                &embedding[..] as &[f64],
                doc.id,
            )
            .execute(&self.pool)
            .await?;
        }
        Ok(())
    }

    pub async fn search(&self, query_vector: &[f32], limit: usize) -> Result<Vec<SearchResult>> {
        // Convert f32 to f64 for PostgreSQL
        let query_vector: Vec<f64> = query_vector.iter().map(|&x| x as f64).collect();

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
                CASE 
                    WHEN d.vector_embedding IS NOT NULL 
                    THEN 1 - (d.vector_embedding <=> $1::float8[])::float8
                    ELSE 0
                END as similarity
            FROM documents d
            WHERE d.vector_embedding IS NOT NULL
            ORDER BY similarity DESC
            LIMIT $2
            "#,
            &query_vector[..] as &[f64],
            limit as i64
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(results
            .into_iter()
            .map(|r| {
                let similarity = r.similarity.unwrap_or(0.0) as f32;
                SearchResult {
                    id: r.id,
                    title: r.title,
                    content: r.content,
                    scores: SearchScores {
                        text_score: 0.0,
                        vector_score: similarity,
                        final_score: similarity,
                    },
                    metadata: SearchMetadata {
                        source_type: "document".to_string(),
                        content_type: r.content_type,
                        author: r.author,
                        created_at: r.created_at,
                        last_modified: r.updated_at,
                        word_count: r.content.split_whitespace().count(),
                        tags: Vec::new(),
                        custom_metadata: serde_json::from_value(r.metadata.unwrap_or(serde_json::Value::Object(serde_json::Map::new())))
                            .unwrap_or_else(|_| HashMap::new()),
                    },
                    highlights: Vec::new(),
                }
            })
            .collect())
    }

    pub async fn hybrid_search(
        &self,
        query: &str,
        query_vector: &[f32],
        limit: usize,
        vector_weight: f32,
    ) -> Result<Vec<SearchResult>> {
        let query_vector: Vec<f64> = query_vector.iter().map(|&x| x as f64).collect();
        let text_weight = 1.0 - vector_weight;

        let results = sqlx::query!(
            r#"
            WITH search_scores AS (
                SELECT 
                    id,
                    title,
                    content,
                    content_type,
                    metadata,
                    author,
                    created_at,
                    updated_at,
                    ts_rank(to_tsvector('english', content), plainto_tsquery($1)) as text_score,
                    CASE 
                        WHEN vector_embedding IS NOT NULL 
                        THEN 1 - (vector_embedding <=> $2::float8[])::float8
                        ELSE 0
                    END as vector_score
                FROM documents
                WHERE 
                    to_tsvector('english', content) @@ plainto_tsquery($1)
                    OR vector_embedding IS NOT NULL
            )
            SELECT *,
                   (COALESCE(text_score, 0) * $3 + COALESCE(vector_score, 0) * $4) as combined_score
            FROM search_scores
            ORDER BY combined_score DESC
            LIMIT $5
            "#,
            query,
            &query_vector[..] as &[f64],
            text_weight as f64,
            vector_weight as f64,
            limit as i64
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(results
            .into_iter()
            .map(|r| {
                let text_score = r.text_score.unwrap_or(0.0) as f32;
                let vector_score = r.vector_score.unwrap_or(0.0) as f32;
                let final_score = r.combined_score.unwrap_or(0.0) as f32;

                SearchResult {
                    id: r.id,
                    title: r.title,
                    content: r.content,
                    scores: SearchScores {
                        text_score,
                        vector_score,
                        final_score,
                    },
                    metadata: SearchMetadata {
                        source_type: "document".to_string(),
                        content_type: r.content_type,
                        author: r.author,
                        created_at: r.created_at,
                        last_modified: r.updated_at,
                        word_count: r.content.split_whitespace().count(),
                        tags: Vec::new(),
                        custom_metadata: serde_json::from_value(r.metadata.unwrap_or(serde_json::Value::Object(serde_json::Map::new())))
                            .unwrap_or_else(|_| HashMap::new()),
                    },
                    highlights: Vec::new(),
                }
            })
            .collect())
    }

    pub fn cosine_similarity(&self, a: &[f32], b: &[f32]) -> f32 {
        if a.len() != b.len() {
            return 0.0;
        }

        let a = Array1::from_vec(a.to_vec());
        let b = Array1::from_vec(b.to_vec());

        let dot_product = a.dot(&b);
        let norm_a = (a.dot(&a)).sqrt();
        let norm_b = (b.dot(&b)).sqrt();

        if norm_a == 0.0 || norm_b == 0.0 {
            0.0
        } else {
            dot_product / (norm_a * norm_b)
        }
    }
}


use super::types::{Document, DocumentScores};
use anyhow::Result;
use sqlx::PgPool;
use uuid::Uuid;
use chrono::{DateTime, Utc};

pub struct DocumentStore {
    pool: PgPool,
}

impl DocumentStore {
    pub async fn new(pool: PgPool) -> Result<Self> {
        Ok(Self { pool })
    }

    pub async fn store_document(&self, document: &Document) -> Result<()> {
        // Convert vector_embedding from f32 to f64
        let vector_embedding = document.vector_embedding.as_ref()
            .map(|v| v.iter().map(|&x| x as f64).collect::<Vec<f64>>());

        sqlx::query!(
            r#"
            INSERT INTO documents (
                id, title, content, content_type, metadata,
                created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            "#,
            Uuid::parse_str(&document.id)?,
            document.title,
            document.content,
            document.content_type,
            serde_json::to_value(&document.metadata)? as _,
            document.created_at,
            document.updated_at,
        )
        .execute(&self.pool)
        .await?;

        // Update vector embedding separately if present
        if let Some(embedding) = vector_embedding {
            sqlx::query!(
                r#"
                UPDATE documents 
                SET vector_embedding = $1::float8[]::vector
                WHERE id = $2
                "#,
                &embedding[..] as _,
                Uuid::parse_str(&document.id)?,
            )
            .execute(&self.pool)
            .await?;
        }

        Ok(())
    }

    pub async fn search(&self, query: &str, limit: i64) -> Result<Vec<Document>> {
        let records = sqlx::query!(
            r#"
            WITH search_results AS (
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
                    ) as similarity
                FROM documents
                WHERE 
                    to_tsvector('english', content) @@ plainto_tsquery('english', $1) OR
                    to_tsvector('english', title) @@ plainto_tsquery('english', $1)
            )
            SELECT *, similarity::float8 as text_score
            FROM search_results
            ORDER BY similarity DESC
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
                highlights: vec![],
                scores: DocumentScores {
                    text_score: r.text_score.unwrap_or(0.0) as f32,
                    vector_score: 0.0,
                    final_score: r.text_score.unwrap_or(0.0) as f32,
                },
                metadata: serde_json::from_value(r.metadata.unwrap_or_default()).unwrap_or_default(),
                vector_embedding: None,
                created_at: r.created_at.unwrap_or_else(|| Utc::now()),
                updated_at: r.updated_at.unwrap_or_else(|| Utc::now()),
            })
            .collect())
    }
}
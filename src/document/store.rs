use anyhow::Result;
use sqlx::PgPool;
use uuid::Uuid;
use crate::document::{Document, DocumentMetadata};
use std::collections::HashMap;

pub struct DocumentStore {
    pool: PgPool,
}

impl DocumentStore {
    pub async fn new(pool: PgPool) -> Result<Self> {
        Ok(Self { pool })
    }

    pub async fn store_document(&self, doc: &Document) -> Result<()> {
        let metadata = serde_json::to_value(&doc.metadata)?;
        
        // Convert vector to float4[]
        let vector_array: Option<Vec<f32>> = doc.vector_embedding.clone();

        sqlx::query!(
            r#"
            INSERT INTO documents 
                (id, title, content, content_type, vector_embedding, metadata, created_at, updated_at)
            VALUES 
                ($1, $2, $3, $4, $5::float4[], $6, $7, $8)
            ON CONFLICT (id) DO UPDATE
            SET 
                title = EXCLUDED.title,
                content = EXCLUDED.content,
                content_type = EXCLUDED.content_type,
                vector_embedding = EXCLUDED.vector_embedding,
                metadata = EXCLUDED.metadata,
                updated_at = CURRENT_TIMESTAMP
            "#,
            doc.id,
            doc.title,
            doc.content,
            doc.content_type,
            vector_array.as_deref(),
            metadata,
            doc.metadata.created_at,
            doc.metadata.last_modified,
        )
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn get_document(&self, id: &Uuid) -> Result<Option<Document>> {
        sqlx::query!(
            r#"
            SELECT 
                id,
                title,
                content,
                content_type,
                vector_embedding::float4[] as vector_embedding,
                metadata,
                created_at,
                updated_at
            FROM documents 
            WHERE id = $1
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await
        .map(|r| {
            r.map(|record| Document {
                id: record.id,
                title: record.title,
                content: record.content,
                content_type: record.content_type,
                vector_embedding: record.vector_embedding,
                metadata: record.metadata
                    .and_then(|v| serde_json::from_value(v).ok())
                    .unwrap_or_else(|| DocumentMetadata {
                        source_type: "database".to_string(),
                        author: None,
                        created_at: record.created_at,
                        last_modified: record.updated_at,
                        language: None,
                        tags: Vec::new(),
                        custom_metadata: HashMap::new(),
                    }),
            })
        })
        .map_err(Into::into)
    }

    pub async fn search(&self, query_vector: &[f32], limit: i64) -> Result<Vec<Document>> {
        sqlx::query!(
            r#"
            WITH search_results AS (
                SELECT 
                    id,
                    title,
                    content, 
                    content_type,
                    vector_embedding::float4[] as vector_embedding,
                    metadata,
                    created_at,
                    updated_at,
                    1 - (vector_embedding <=> $1::float4[]) as similarity
                FROM documents
                WHERE vector_embedding IS NOT NULL
                ORDER BY similarity DESC
                LIMIT $2
            )
            SELECT * FROM search_results
            "#,
            query_vector as &[f32],
            limit
        )
        .fetch_all(&self.pool)
        .await?
        .into_iter()
        .map(|record| Ok(Document {
            id: record.id,
            title: record.title,
            content: record.content,
            content_type: record.content_type,
            vector_embedding: record.vector_embedding,
            metadata: record.metadata
                .and_then(|v| serde_json::from_value(v).ok())
                .unwrap_or_else(|| DocumentMetadata {
                    source_type: "database".to_string(),
                    author: None,
                    created_at: record.created_at,
                    last_modified: record.updated_at,
                    language: None,
                    tags: Vec::new(),
                    custom_metadata: HashMap::new(),
                }),
        }))
        .collect()
    }
}
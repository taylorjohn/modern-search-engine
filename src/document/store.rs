use anyhow::{Result, Context};
use sqlx::PgPool;
use uuid::Uuid;
use crate::document::{Document, DocumentMetadata};
use std::collections::HashMap;
use chrono::{DateTime, Utc};

pub struct DocumentStore {
    pool: PgPool,
}

impl DocumentStore {
    pub async fn new(pool: PgPool) -> Result<Self> {
        // Initialize store
        let store = Self { pool };
        
        // Ensure all required extensions and types
        sqlx::query!(
            r#"
            CREATE EXTENSION IF NOT EXISTS vector;
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
            "#
        )
        .execute(&store.pool)
        .await
        .context("Failed to initialize database extensions")?;

        Ok(store)
    }

    pub async fn store_document(&self, doc: &Document) -> Result<()> {
        let metadata = serde_json::to_value(&doc.metadata)
            .context("Failed to serialize document metadata")?;
        
        // Convert vector embedding to SQL array
        let vector_embedding = doc.vector_embedding.as_ref().map(|v| v.as_slice());

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
            vector_embedding,
            metadata,
            doc.metadata.created_at,
            doc.metadata.last_modified,
        )
        .execute(&self.pool)
        .await
        .context("Failed to store document")?;

        Ok(())
    }

    pub async fn get_document(&self, id: &Uuid) -> Result<Option<Document>> {
        sqlx::query!(
            r#"
            SELECT 
                d.id,
                d.title,
                d.content,
                d.content_type,
                d.vector_embedding as "vector_embedding: Vec<f32>",
                d.metadata,
                d.created_at,
                d.updated_at
            FROM documents d
            WHERE d.id = $1
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await
        .context("Failed to fetch document")?
        .map(|r| Document {
            id: r.id,
            title: r.title,
            content: r.content,
            content_type: r.content_type,
            vector_embedding: r.vector_embedding,
            metadata: parse_metadata(r.metadata, r.created_at, r.updated_at),
        })
        .transpose()
    }

    pub async fn search(&self, query_vector: &[f32], limit: i64) -> Result<Vec<Document>> {
        sqlx::query!(
            r#"
            WITH similarity_search AS (
                SELECT 
                    d.id,
                    d.title,
                    d.content,
                    d.content_type,
                    d.vector_embedding as "vector_embedding: Vec<f32>",
                    d.metadata,
                    d.created_at,
                    d.updated_at,
                    1 - (d.vector_embedding::float4[] <=> $1::float4[]) as similarity
                FROM documents d
                WHERE d.vector_embedding IS NOT NULL
                ORDER BY similarity DESC
                LIMIT $2
            )
            SELECT * FROM similarity_search
            "#,
            query_vector as &[f32],
            limit
        )
        .fetch_all(&self.pool)
        .await
        .context("Failed to perform similarity search")?
        .into_iter()
        .map(|r| Ok(Document {
            id: r.id,
            title: r.title,
            content: r.content,
            content_type: r.content_type,
            vector_embedding: r.vector_embedding,
            metadata: parse_metadata(r.metadata, r.created_at, r.updated_at),
        }))
        .collect()
    }

    pub async fn delete_document(&self, id: &Uuid) -> Result<bool> {
        let result = sqlx::query!(
            "DELETE FROM documents WHERE id = $1",
            id
        )
        .execute(&self.pool)
        .await
        .context("Failed to delete document")?;

        Ok(result.rows_affected() > 0)
    }

    pub async fn list_documents(&self, limit: i64, offset: i64) -> Result<Vec<Document>> {
        sqlx::query!(
            r#"
            SELECT 
                d.id,
                d.title,
                d.content,
                d.content_type,
                d.vector_embedding as "vector_embedding: Vec<f32>",
                d.metadata,
                d.created_at,
                d.updated_at
            FROM documents d
            ORDER BY d.created_at DESC
            LIMIT $1 OFFSET $2
            "#,
            limit,
            offset
        )
        .fetch_all(&self.pool)
        .await
        .context("Failed to list documents")?
        .into_iter()
        .map(|r| Ok(Document {
            id: r.id,
            title: r.title,
            content: r.content,
            content_type: r.content_type,
            vector_embedding: r.vector_embedding,
            metadata: parse_metadata(r.metadata, r.created_at, r.updated_at),
        }))
        .collect()
    }
}

// Helper function to parse metadata with fallback
fn parse_metadata(
    metadata: Option<serde_json::Value>,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
) -> DocumentMetadata {
    metadata
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_else(|| DocumentMetadata {
            source_type: "database".to_string(),
            author: None,
            created_at,
            last_modified: updated_at,
            language: None,
            tags: Vec::new(),
            custom_metadata: HashMap::new(),
        })
}

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::postgres::PgPoolOptions;

    async fn create_test_pool() -> Result<PgPool> {
        let pool = PgPoolOptions::new()
            .max_connections(5)
            .connect(&std::env::var("DATABASE_URL")
                .unwrap_or_else(|_| "postgres://localhost/test_db".to_string()))
            .await?;
        
        Ok(pool)
    }

    #[tokio::test]
    async fn test_document_crud() -> Result<()> {
        let pool = create_test_pool().await?;
        let store = DocumentStore::new(pool).await?;

        // Create test document
        let doc = Document {
            id: Uuid::new_v4(),
            title: "Test Document".to_string(),
            content: "Test content".to_string(),
            content_type: "text/plain".to_string(),
            vector_embedding: Some(vec![0.1, 0.2, 0.3]),
            metadata: DocumentMetadata::default(),
        };

        // Test store
        store.store_document(&doc).await?;

        // Test retrieve
        let retrieved = store.get_document(&doc.id).await?
            .expect("Document should exist");
        assert_eq!(retrieved.title, doc.title);

        // Test delete
        assert!(store.delete_document(&doc.id).await?);

        // Verify deletion
        assert!(store.get_document(&doc.id).await?.is_none());

        Ok(())
    }
}
// src/document/store.rs

use crate::document::{Document, DocumentMetadata};
use sqlx::PgPool;
use uuid::Uuid;
use anyhow::{Result, Context};
use chrono::Utc;
use serde_json::Value;
use std::collections::HashMap;

pub struct DocumentStore {
    pool: PgPool
}

#[derive(Debug)]
pub enum ProcessingStatus {
    Pending,
    Processing,
    Completed,
    Failed,
}

impl ToString for ProcessingStatus {
    fn to_string(&self) -> String {
        match self {
            Self::Pending => "pending",
            Self::Processing => "processing",
            Self::Completed => "completed",
            Self::Failed => "failed",
        }.to_string()
    }
}

impl DocumentStore {
    pub async fn new(pool: PgPool) -> Result<Self> {
        Ok(Self { pool })
    }

    pub async fn store_document(&self, document: Document) -> Result<Uuid> {
        let metadata = serde_json::to_value(&document.metadata.custom_metadata)?;

        // Insert document
        let record = sqlx::query!(
            r#"
            INSERT INTO documents 
                (title, content, content_type, vector_embedding, metadata, author, created_at, updated_at)
            VALUES 
                ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id
            "#,
            document.title,
            document.content,
            document.content_type,
            document.vector_embedding.as_ref().map(|v| v.as_slice()),
            metadata,
            document.metadata.author,
            document.metadata.created_at,
            document.metadata.last_modified
        )
        .fetch_one(&self.pool)
        .await
        .context("Failed to insert document")?;

        Ok(record.id)
    }

    pub async fn get_document(&self, id: Uuid) -> Result<Option<Document>> {
        let record = sqlx::query!(
            r#"
            SELECT 
                id, title, content, content_type, vector_embedding, 
                metadata, created_at, updated_at, author
            FROM documents
            WHERE id = $1
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await?;

        Ok(record.map(|r| Document {
            id: r.id,
            title: r.title,
            content: r.content,
            content_type: r.content_type,
            vector_embedding: r.vector_embedding.map(|v| v.to_vec()),
            metadata: DocumentMetadata {
                source_type: "document".to_string(),
                author: r.author,
                created_at: r.created_at,
                last_modified: r.updated_at,
                language: None,
                tags: Vec::new(),
                custom_metadata: serde_json::from_value(r.metadata)
                    .unwrap_or_else(|_| HashMap::new()),
            },
        }))
    }

    pub async fn create_processing_task(&self, document_id: Uuid) -> Result<Uuid> {
        let record = sqlx::query!(
            r#"
            INSERT INTO processing_tasks
                (document_id, status, progress)
            VALUES
                ($1, $2, $3)
            RETURNING id
            "#,
            document_id,
            ProcessingStatus::Pending.to_string(),
            0.0f64
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(record.id)
    }

    pub async fn update_processing_status(
        &self,
        task_id: Uuid,
        status: ProcessingStatus,
        progress: f64,
        error: Option<String>
    ) -> Result<()> {
        sqlx::query!(
            r#"
            UPDATE processing_tasks
            SET status = $1, progress = $2, error = $3
            WHERE id = $4
            "#,
            status.to_string(),
            progress,
            error,
            task_id
        )
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn search_documents(
        &self,
        query: &str,
        limit: Option<i64>,
        offset: Option<i64>,
    ) -> Result<Vec<Document>> {
        let records = sqlx::query!(
            r#"
            WITH ranked_docs AS (
                SELECT 
                    id, title, content, content_type, vector_embedding,
                    metadata, created_at, updated_at, author,
                    ts_rank_cd(to_tsvector('english', content), plainto_tsquery($1)) +
                    ts_rank_cd(to_tsvector('english', title), plainto_tsquery($1)) as rank
                FROM documents
                WHERE 
                    to_tsvector('english', content) @@ plainto_tsquery($1)
                    OR to_tsvector('english', title) @@ plainto_tsquery($1)
            )
            SELECT * FROM ranked_docs
            ORDER BY rank DESC
            LIMIT $2
            OFFSET $3
            "#,
            query,
            limit.unwrap_or(10),
            offset.unwrap_or(0)
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(records.into_iter()
            .map(|r| Document {
                id: r.id,
                title: r.title,
                content: r.content,
                content_type: r.content_type,
                vector_embedding: r.vector_embedding.map(|v| v.to_vec()),
                metadata: DocumentMetadata {
                    source_type: "document".to_string(),
                    author: r.author,
                    created_at: r.created_at,
                    last_modified: r.updated_at,
                    language: None,
                    tags: Vec::new(),
                    custom_metadata: serde_json::from_value(r.metadata)
                        .unwrap_or_else(|_| HashMap::new()),
                },
            })
            .collect())
    }
}

impl Default for DocumentMetadata {
    fn default() -> Self {
        Self {
            source_type: "unknown".to_string(),
            author: None,
            created_at: Utc::now(),
            last_modified: Utc::now(),
            language: None,
            tags: Vec::new(),
            custom_metadata: HashMap::new(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::postgres::PgPoolOptions;

    #[tokio::test]
    async fn test_document_crud() -> Result<()> {
        // Setup test database connection
        let pool = PgPoolOptions::new()
            .max_connections(5)
            .connect("postgres://localhost/test_db")
            .await?;

        let store = DocumentStore::new(pool).await?;

        // Create test document
        let doc = Document {
            id: uuid::Uuid::new_v4().to_string(),
            title: "Test Document".to_string(),
            content: "Test content".to_string(),
            content_type: "text".to_string(),
            metadata: DocumentMetadata::default(),
            vector_embedding: Some(vec![0.1, 0.2, 0.3]),
        };

        // Test store
        let id = store.store_document(doc.clone()).await?;

        // Test retrieve
        let retrieved = store.get_document(&id).await?.unwrap();
        assert_eq!(retrieved.title, doc.title);

        // Test update
        let mut updated = retrieved;
        updated.title = "Updated Title".to_string();
        store.update_document(&id, updated.clone()).await?;

        // Test delete
        store.delete_document(&id).await?;
        assert!(store.get_document(&id).await?.is_none());

        Ok(())
    }
}
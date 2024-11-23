// src/document/store.rs

use crate::document::{Document, DocumentMetadata};
use anyhow::Result;
use sqlx::PgPool;
use std::collections::HashMap;
use std::sync::RwLock;
use chrono::Utc;

pub struct DocumentStore {
    pool: PgPool,
    cache: RwLock<HashMap<String, Document>>,
}

impl DocumentStore {
    pub async fn new(pool: PgPool) -> Result<Self> {
        Ok(Self {
            pool,
            cache: RwLock::new(HashMap::new()),
        })
    }

    pub async fn store_document(&self, document: Document) -> Result<String> {
        // Insert into database
        let id = sqlx::query!(
            r#"
            INSERT INTO documents 
                (id, title, content, content_type, vector_embedding, metadata, created_at, updated_at)
            VALUES 
                ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id
            "#,
            document.id,
            document.title,
            document.content,
            document.content_type,
            document.vector_embedding.as_ref().map(|v| v.as_slice()),
            serde_json::to_value(&document.metadata)?,
            document.metadata.created_at,
            document.metadata.last_modified
        )
        .fetch_one(&self.pool)
        .await?
        .id;

        // Update cache
        if let Ok(mut cache) = self.cache.write() {
            cache.insert(id.clone(), document);
        }

        Ok(id)
    }

    pub async fn get_document(&self, id: &str) -> Result<Option<Document>> {
        // Check cache first
        if let Ok(cache) = self.cache.read() {
            if let Some(doc) = cache.get(id) {
                return Ok(Some(doc.clone()));
            }
        }

        // Query database
        let record = sqlx::query!(
            r#"
            SELECT 
                id, title, content, content_type, vector_embedding, metadata,
                created_at, updated_at
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
            metadata: serde_json::from_value(r.metadata)
                .unwrap_or_else(|_| DocumentMetadata {
                    source_type: "unknown".to_string(),
                    author: None,
                    created_at: r.created_at,
                    last_modified: r.updated_at,
                    language: None,
                    tags: vec![],
                    custom_metadata: HashMap::new(),
                }),
        }))
    }

    pub async fn update_document(&self, id: &str, document: Document) -> Result<()> {
        // Update database
        sqlx::query!(
            r#"
            UPDATE documents 
            SET 
                title = $2,
                content = $3,
                content_type = $4,
                vector_embedding = $5,
                metadata = $6,
                updated_at = $7
            WHERE id = $1
            "#,
            id,
            document.title,
            document.content,
            document.content_type,
            document.vector_embedding.as_ref().map(|v| v.as_slice()),
            serde_json::to_value(&document.metadata)?,
            Utc::now()
        )
        .execute(&self.pool)
        .await?;

        // Update cache
        if let Ok(mut cache) = self.cache.write() {
            cache.insert(id.to_string(), document);
        }

        Ok(())
    }

    pub async fn delete_document(&self, id: &str) -> Result<()> {
        // Delete from database
        sqlx::query!("DELETE FROM documents WHERE id = $1", id)
            .execute(&self.pool)
            .await?;

        // Remove from cache
        if let Ok(mut cache) = self.cache.write() {
            cache.remove(id);
        }

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
                    id, title, content, content_type, vector_embedding, metadata,
                    created_at, updated_at,
                    ts_rank(to_tsvector('english', content), plainto_tsquery('english', $1)) +
                    ts_rank(to_tsvector('english', title), plainto_tsquery('english', $1)) as rank
                FROM documents
                WHERE 
                    to_tsvector('english', content) @@ plainto_tsquery('english', $1)
                    OR to_tsvector('english', title) @@ plainto_tsquery('english', $1)
            )
            SELECT * FROM ranked_docs
            ORDER BY rank DESC
            LIMIT $2
            OFFSET $3
            "#,
            query,
            limit.unwrap_or(10),
            offset.unwrap_or(0),
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(records
            .into_iter()
            .map(|r| Document {
                id: r.id,
                title: r.title,
                content: r.content,
                content_type: r.content_type,
                vector_embedding: r.vector_embedding.map(|v| v.to_vec()),
                metadata: serde_json::from_value(r.metadata)
                    .unwrap_or_else(|_| DocumentMetadata {
                        source_type: "unknown".to_string(),
                        author: None,
                        created_at: r.created_at,
                        last_modified: r.updated_at,
                        language: None,
                        tags: vec![],
                        custom_metadata: HashMap::new(),
                    }),
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
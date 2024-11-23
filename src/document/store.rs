use crate::document::{Document, DocumentMetadata as OtherDocumentMetadata};
use anyhow::Result;
use sqlx::{PgPool, postgres::PgPoolOptions};
use std::collections::HashMap;
use uuid::Uuid;
use chrono::Utc;
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct DocumentMetadata {
    pub source_type: String,
    pub author: Option<String>,
    pub created_at: chrono::DateTime<Utc>,
    pub last_modified: chrono::DateTime<Utc>,
    pub language: Option<String>,
    pub tags: Vec<String>,
    pub custom_metadata: HashMap<String, String>,
}

pub struct DocumentStore {
    pool: PgPool,
    cache: HashMap<String, Document>,
}

impl DocumentStore {
    pub async fn new() -> Result<Self> {
        let database_url = std::env::var("DATABASE_URL")
            .unwrap_or_else(|_| "postgres://localhost/search_engine".to_string());

        let pool = PgPoolOptions::new()
            .max_connections(5)
            .connect(&database_url)
            .await?;

        Ok(Self {
            pool,
            cache: HashMap::new(),
        })
    }

    pub async fn store_document(&mut self, document: Document) -> Result<String> {
        // Insert into database
        let id = sqlx::query!(
            r#"
            INSERT INTO documents 
                (id, title, content, content_type, vector_embedding, metadata)
            VALUES 
                ($1, $2, $3, $4, $5, $6)
            RETURNING id
            "#,
            document.id,
            document.title,
            document.content,
            document.content_type,
            document.vector_embedding.as_ref().map(|v| v.as_slice()),
            serde_json::to_value(&document.metadata)?
        )
        .fetch_one(&self.pool)
        .await?
        .id;

        // Update cache
        self.cache.insert(id.clone(), document);

        Ok(id)
    }

    pub async fn get_document(&self, id: &str) -> Result<Option<Document>> {
        // Check cache first
        if let Some(doc) = self.cache.get(id) {
            return Ok(Some(doc.clone()));
        }

        // Query database
        let record = sqlx::query!(
            r#"
            SELECT 
                id, title, content, content_type, vector_embedding, metadata
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
                    created_at: Utc::now(),
                    last_modified: Utc::now(),
                    language: None,
                    tags: vec![],
                    custom_metadata: HashMap::new(),
                }),
        }))
    }

    pub async fn update_document(&mut self, id: &str, document: Document) -> Result<()> {
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
            Utc::now(),
        )
        .execute(&self.pool)
        .await?;

        // Update cache
        self.cache.insert(id.to_string(), document);

        Ok(())
    }

    pub async fn delete_document(&mut self, id: &str) -> Result<()> {
        // Delete from database
        sqlx::query!("DELETE FROM documents WHERE id = $1", id)
            .execute(&self.pool)
            .await?;

        // Remove from cache
        self.cache.remove(id);

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
            SELECT 
                id, title, content, content_type, vector_embedding, metadata
            FROM documents
            WHERE 
                to_tsvector('english', content) @@ plainto_tsquery('english', $1)
                OR to_tsvector('english', title) @@ plainto_tsquery('english', $1)
            ORDER BY 
                ts_rank(to_tsvector('english', content), plainto_tsquery('english', $1)) +
                ts_rank(to_tsvector('english', title), plainto_tsquery('english', $1)) DESC
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
                    .unwrap_or_else(|_| DocumentMetadata::default()),
            })
            .collect())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_document_crud() {
        let mut store = DocumentStore::new().await.unwrap();

        // Create document
        let doc = Document {
            id: Uuid::new_v4().to_string(),
            title: "Test Document".to_string(),
            content: "Test content".to_string(),
            content_type: "text".to_string(),
            metadata: DocumentMetadata::default(),
            vector_embedding: Some(vec![0.1, 0.2, 0.3]),
        };

        // Test store
        let id = store.store_document(doc.clone()).await.unwrap();

        // Test retrieve
        let retrieved = store.get_document(&id).await.unwrap().unwrap();
        assert_eq!(retrieved.title, doc.title);

        // Test update
        let mut updated = retrieved;
        updated.title = "Updated Title".to_string();
        store.update_document(&id, updated.clone()).await.unwrap();

        // Test delete
        store.delete_document(&id).await.unwrap();
        assert!(store.get_document(&id).await.unwrap().is_none());
    }
}
use anyhow::Result;
use sqlx::PgPool;
use uuid::Uuid;
use serde_json::Value;
use crate::vector::types::{VectorDocument, VectorSearchResult};
use crate::document::{Document, DocumentMetadata};
use chrono::Utc;

pub struct VectorStore {
    pool: PgPool,
}

impl VectorStore {
    pub async fn new(pool: PgPool) -> Result<Self> {
        Ok(Self { pool })
    }

    pub async fn search(
        &self,
        query_embedding: &[f32],
        limit: usize,
        threshold: f32,
    ) -> Result<Vec<VectorSearchResult>> {
        let results = sqlx::query!(
            r#"
            SELECT 
                id,
                title,
                content,
                content_type,
                1 - (vector_embedding <=> $1::vector(384)) as similarity
            FROM documents
            WHERE 1 - (vector_embedding <=> $1::vector(384)) > $2
            ORDER BY similarity DESC
            LIMIT $3
            "#,
            query_embedding as &[f32],
            threshold,
            limit as i64
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(results
            .into_iter()
            .map(|r| VectorSearchResult {
                id: r.id.to_string(),
                title: r.title,
                content: r.content,
                score: r.similarity.unwrap_or_default(),
            })
            .collect())
    }

    pub async fn add_document(&self, doc: &Document) -> Result<()> {
        let id = Uuid::parse_str(&doc.id)?;
        let metadata = serde_json::to_value(&doc.metadata)?;
        let now = Utc::now();

        sqlx::query!(
            r#"
            INSERT INTO documents (
                id, title, content, content_type, vector_embedding, metadata, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
            ON CONFLICT (id) DO UPDATE 
            SET 
                title = $2,
                content = $3,
                content_type = $4,
                vector_embedding = $5,
                metadata = $6,
                updated_at = CURRENT_TIMESTAMP
            "#,
            id,
            doc.title,
            doc.content,
            doc.content_type,
            doc.vector_embedding.as_ref().map(|v| v.as_slice()),
            metadata,
            now,
        )
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn get_document(&self, id: &str) -> Result<Option<Document>> {
        let uuid = Uuid::parse_str(id)?;
        let record = sqlx::query!(
            r#"
            SELECT 
                id,
                title,
                content,
                content_type,
                vector_embedding as "vector_embedding?: Vec<f32>",
                metadata as "metadata: Value",
                created_at,
                updated_at
            FROM documents 
            WHERE id = $1
            "#,
            uuid
        )
        .fetch_optional(&self.pool)
        .await?;

        Ok(record.map(|r| Document {
            id: r.id.to_string(),
            title: r.title,
            content: r.content,
            content_type: r.content_type,
            vector_embedding: r.vector_embedding,
            metadata: serde_json::from_value(r.metadata).unwrap_or_default(),
            created_at: r.created_at,
            updated_at: r.updated_at,
        }))
    }

    pub async fn delete_document(&self, id: &str) -> Result<()> {
        let uuid = Uuid::parse_str(id)?;
        sqlx::query!("DELETE FROM documents WHERE id = $1", uuid)
            .execute(&self.pool)
            .await?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::postgres::PgPoolOptions;

    async fn create_test_pool() -> Result<PgPool> {
        let pool = PgPoolOptions::new()
            .max_connections(5)
            .connect("postgres://localhost/modern_search")
            .await?;
        Ok(pool)
    }

    #[sqlx::test]
    async fn test_add_and_retrieve_document() -> Result<()> {
        let pool = create_test_pool().await?;
        let store = VectorStore::new(pool).await?;

        let doc = Document {
            id: Uuid::new_v4().to_string(),
            title: "Test Document".to_string(),
            content: "Test content".to_string(),
            content_type: "text/plain".to_string(),
            vector_embedding: Some(vec![0.1; 384]),
            metadata: DocumentMetadata::default(),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        store.add_document(&doc).await?;
        let retrieved = store.get_document(&doc.id).await?.unwrap();
        assert_eq!(retrieved.title, doc.title);
        assert_eq!(retrieved.content, doc.content);

        Ok(())
    }

    #[sqlx::test]
    async fn test_search() -> Result<()> {
        let pool = create_test_pool().await?;
        let store = VectorStore::new(pool).await?;

        let results = store.search(&vec![0.1; 384], 10, 0.5).await?;
        println!("Found {} results", results.len());

        Ok(())
    }
}
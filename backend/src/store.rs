use super::Document;
use anyhow::Result;
use sqlx::PgPool;
use std::sync::Arc;
use uuid::Uuid;
use chrono::Utc;

pub struct DocumentStore {
    pool: Arc<PgPool>,
}

impl DocumentStore {
    pub fn new(pool: Arc<PgPool>) -> Self {
        Self { pool }
    }

    pub async fn store_document(&self, doc: &Document) -> Result<()> {
        sqlx::query!(
            r#"
            INSERT INTO documents (
                id, title, content, content_type, metadata,
                created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (id) DO UPDATE 
            SET title = $2, content = $3, content_type = $4, 
                metadata = $5, updated_at = $7
            "#,
            Uuid::parse_str(&doc.id)?,
            doc.title,
            doc.content,
            doc.content_type,
            serde_json::to_value(&doc.metadata)?,
            doc.created_at,
            doc.updated_at,
        )
        .execute(&*self.pool)
        .await?;

        Ok(())
    }

    pub async fn get_document(&self, doc_id: &str) -> Result<Option<Document>> {
        let record = sqlx::query!(
            r#"
            SELECT id::text as "id!", title, content, content_type, 
                   metadata as "metadata!: serde_json::Value",
                   created_at, updated_at
            FROM documents
            WHERE id = $1
            "#,
            Uuid::parse_str(doc_id)?
        )
        .fetch_optional(&*self.pool)
        .await?;

        Ok(record.map(|r| Document {
            id: r.id,
            title: r.title,
            content: r.content,
            content_type: r.content_type,
            metadata: serde_json::from_value(r.metadata).unwrap_or_default(),
            vector_embedding: None,
            scores: Default::default(),
            highlights: Vec::new(),
            created_at: r.created_at.unwrap_or_else(Utc::now),
            updated_at: r.updated_at.unwrap_or_else(Utc::now),
        }))
    }
}
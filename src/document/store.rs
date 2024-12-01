use anyhow::Result;
use sqlx::PgPool;
use crate::document::{Document, DocumentMetadata};
use uuid::Uuid;

pub struct DocumentStore {
    pool: PgPool,
}

impl DocumentStore {
    pub async fn new(pool: PgPool) -> Result<Self> {
        Ok(Self { pool })
    }

    pub async fn store_document(&self, document: &Document) -> Result<()> {
        let id = Uuid::parse_str(&document.id)?;
        sqlx::query!(
            r#"
            INSERT INTO documents 
                (id, title, content, content_type, vector_embedding, metadata,
                created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5::float4[], $6, $7, $8)
            "#,
            id,
            document.title,
            document.content,
            document.content_type,
            document.vector_embedding.as_ref().map(|v| v.as_slice()),
            serde_json::to_value(&document.metadata)?,
            document.created_at,
            document.updated_at,
        )
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn get_document(&self, id: Uuid) -> Result<Option<Document>> {
        let record = sqlx::query!(
            r#"
            SELECT 
                id,
                title,
                content, 
                content_type,
                vector_embedding as "vector_embedding?: Vec<f32>",
                metadata as "metadata!: serde_json::Value",
                created_at,
                updated_at
            FROM documents 
            WHERE id = $1
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await?;

        Ok(record.map(|r| Document {
            id: r.id.to_string(),
            title: r.title,
            content: r.content,
            content_type: r.content_type,
            vector_embedding: r.vector_embedding,
            metadata: serde_json::from_value(r.metadata)
                .unwrap_or_else(|_| DocumentMetadata::default()),
            created_at: r.created_at,
            updated_at: r.updated_at,
        }))
    }
}
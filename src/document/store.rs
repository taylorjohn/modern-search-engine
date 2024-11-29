// src/document/store.rs
use sqlx::PgPool;
use sqlx::types::{Uuid, JsonValue};
use anyhow::Result;

pub struct DocumentStore {
    pool: PgPool,
}

impl DocumentStore {
    pub async fn new(pool: PgPool) -> Result<Self> {
        Ok(Self { pool })
    }

    pub async fn add_document(&self, 
        title: &str,
        content: &str, 
        content_type: &str,
        metadata: JsonValue
    ) -> Result<Uuid> {
        let id = sqlx::query!(
            r#"
            INSERT INTO documents (title, content, content_type, metadata)
            VALUES ($1, $2, $3, $4)
            RETURNING id
            "#,
            title,
            content,
            content_type,
            metadata
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(id.id)
    }

    pub async fn get_document(&self, id: Uuid) -> Result<Option<Document>> {
        sqlx::query_as!(Document,
            r#"
            SELECT id, title, content, content_type, metadata, created_at, updated_at
            FROM documents 
            WHERE id = $1
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await
    }
}

#[derive(sqlx::FromRow)]
pub struct Document {
    pub id: Uuid,
    pub title: String,
    pub content: String,
    pub content_type: String,
    pub metadata: JsonValue,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}
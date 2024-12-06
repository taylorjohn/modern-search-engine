use crate::document::{Document, DocumentMetadata, DocumentScores};
use crate::DocumentUpload;
use crate::vector::VectorStore;
use anyhow::Result;
use std::sync::Arc;
use tokio::sync::RwLock;
use sqlx::PgPool;
use serde_json;
use chrono::Utc;

pub struct DocumentProcessor {
    vector_store: Arc<RwLock<VectorStore>>,
    pool: Arc<PgPool>,
}

impl DocumentProcessor {
    pub fn new(vector_store: Arc<RwLock<VectorStore>>, pool: Arc<PgPool>) -> Self {
        Self {
            vector_store,
            pool,
        }
    }

    pub async fn process_document(&self, upload: DocumentUpload) -> Result<Document> {
        let doc = match upload {
            DocumentUpload::Text { content, title, metadata } => {
                // Calculate word count before moving content
                let word_count = content.split_whitespace().count();

                // Insert document into database
                let result = sqlx::query!(
                    r#"
                    INSERT INTO documents (title, content, content_type, metadata)
                    VALUES ($1, $2, $3, $4)
                    RETURNING id::text, created_at, updated_at
                    "#,
                    title,
                    content.as_str(),
                    "text/plain",
                    serde_json::to_value(metadata.clone()).unwrap_or_default()
                )
                .fetch_one(&*self.pool)
                .await?;

                Document {
                    id: result.id.unwrap_or_default(),
                    title,
                    content,
                    content_type: "text/plain".to_string(),
                    metadata: DocumentMetadata {
                        source_type: "upload".to_string(),
                        author: None,
                        language: None,
                        word_count,
                        tags: vec![],
                        custom_metadata: metadata.unwrap_or_default(),
                    },
                    vector_embedding: None,
                    scores: DocumentScores::default(),
                    highlights: vec![],
                    created_at: result.created_at.unwrap_or_else(|| Utc::now()),
                    updated_at: result.updated_at.unwrap_or_else(|| Utc::now()),
                }
            },
            // Add other variants later
            _ => anyhow::bail!("Unsupported document type"),
        };

        Ok(doc)
    }
}
use crate::document::{Document, DocumentMetadata, ProcessingStatus};
use crate::vector::store::VectorStore;
use anyhow::Result;
use std::sync::Arc;
use tokio::sync::RwLock;
use tokio::io::AsyncReadExt;
use uuid::Uuid;
use chrono::Utc;

pub struct DocumentIngester {
    vector_store: Arc<RwLock<VectorStore>>,
    store: Arc<RwLock<crate::document::store::DocumentStore>>,
}

#[derive(Debug)]
pub struct IngestionOptions {
    pub batch_size: usize,
    pub parallel_processing: bool,
    pub validate_content: bool,
    pub generate_metadata: bool,
    pub extract_text: bool,
}

impl Default for IngestionOptions {
    fn default() -> Self {
        Self {
            batch_size: 100,
            parallel_processing: true,
            validate_content: true,
            generate_metadata: true,
            extract_text: true,
        }
    }
}

impl DocumentIngester {
    pub fn new(
        vector_store: Arc<RwLock<VectorStore>>,
        store: Arc<RwLock<crate::document::store::DocumentStore>>,
    ) -> Self {
        Self {
            vector_store,
            store,
        }
    }

    pub async fn ingest_file(&self, path: &str, options: Option<IngestionOptions>) -> Result<String> {
        let options = options.unwrap_or_default();
        let mut file = tokio::fs::File::open(path).await?;
        let mut content = Vec::new();
        file.read_to_end(&mut content).await?;

        self.ingest_content(content, path, options).await
    }

    pub async fn ingest_content(
        &self,
        content: Vec<u8>,
        filename: &str,
        options: IngestionOptions,
    ) -> Result<String> {
        // Extract text and metadata
        let (text, metadata) = if options.extract_text {
            self.extract_content(&content, filename).await?
        } else {
            (String::from_utf8_lossy(&content).to_string(), DocumentMetadata::default())
        };

        // Generate vector embedding
        let vector_store = self.vector_store.read().await;
        let vector_embedding = vector_store.generate_embedding(&text).await?;

        // Create document
        let document = Document {
            id: Uuid::new_v4().to_string(),
            title: filename.to_string(),
            content: text,
            content_type: self.determine_content_type(filename),
            metadata,
            vector_embedding: Some(vector_embedding),
        };

        // Store document
        let mut store = self.store.write().await;
        store.store_document(document.clone()).await?;

        Ok(document.id)
    }

    pub async fn ingest_batch(
        &self,
        files: Vec<(String, Vec<u8>)>,
        options: Option<IngestionOptions>,
    ) -> Result<Vec<String>> {
        let options = options.unwrap_or_default();
        let mut document_ids = Vec::new();

        if options.parallel_processing {
            use futures::stream::{self, StreamExt};

            let results = stream::iter(files)
                .map(|(filename, content)| {
                    let ingester = self.clone();
                    let opts = options.clone();
                    async move {
                        ingester.ingest_content(content, &filename, opts).await
                    }
                })
                .buffer_unordered(options.batch_size)
                .collect::<Vec<_>>()
                .await;

            for result in results {
                document_ids.push(result?);
            }
        } else {
            for (filename, content) in files {
                let id = self.ingest_content(content, &filename, options.clone()).await?;
                document_ids.push(id);
            }
        }

        Ok(document_ids)
    }

    async fn extract_content(&self, content: &[u8], filename: &str) -> Result<(String, DocumentMetadata)> {
        let content_type = self.determine_content_type(filename);
        
        let (text, metadata) = match content_type.as_str() {
            "pdf" => {
                let doc = lopdf::Document::load_mem(content)?;
                let text = doc.extract_text(&[1])?;
                let metadata = DocumentMetadata {
                    source_type: "pdf".to_string(),
                    author: doc.get_metadata().author,
                    created_at: Utc::now(),
                    last_modified: Utc::now(),
                    language: None,
                    tags: Vec::new(),
                    custom_metadata: Default::default(),
                };
                (text, metadata)
            },
            "html" => {
                let text = html2text::from_bytes(content, 80);
                (text, DocumentMetadata::default())
            },
            _ => {
                let text = String::from_utf8_lossy(content).to_string();
                (text, DocumentMetadata::default())
            }
        };

        Ok((text, metadata))
    }

    fn determine_content_type(&self, filename: &str) -> String {
        match std::path::Path::new(filename)
            .extension()
            .and_then(std::ffi::OsStr::to_str)
            .map(str::to_lowercase)
        {
            Some(ext) => ext,
            None => "txt".to_string(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::NamedTempFile;
    use std::io::Write;

    #[tokio::test]
    async fn test_ingest_text_file() {
        // Create temporary test file
        let mut temp_file = NamedTempFile::new().unwrap();
        writeln!(temp_file, "Test content").unwrap();

        // Setup ingester
        let vector_store = Arc::new(RwLock::new(VectorStore::new().await.unwrap()));
        let doc_store = Arc::new(RwLock::new(crate::document::store::DocumentStore::new().await.unwrap()));
        let ingester = DocumentIngester::new(vector_store, doc_store);

        // Test ingestion
        let result = ingester.ingest_file(
            temp_file.path().to_str().unwrap(),
            None,
        ).await;

        assert!(result.is_ok());
    }
}
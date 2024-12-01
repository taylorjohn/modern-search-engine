use crate::vector::store::VectorStore;
use crate::document::{Document, DocumentMetadata};
use anyhow::Result;
use std::sync::Arc;
use tokio::sync::RwLock;
use serde::{Serialize, Deserialize};

pub struct SearchEngine {
    vector_store: Arc<RwLock<VectorStore>>,
    config: SearchConfig,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SearchConfig {
    pub max_results: usize,
    pub min_score: f32,
    pub vector_weight: f32,
    pub text_weight: f32,
}

impl Default for SearchConfig {
    fn default() -> Self {
        Self {
            max_results: 10,
            min_score: 0.1,
            vector_weight: 0.6,
            text_weight: 0.4,
        }
    }
}

impl SearchEngine {
    pub fn new(vector_store: Arc<RwLock<VectorStore>>, config: SearchConfig) -> Self {
        Self {
            vector_store,
            config,
        }
    }

    pub async fn search(
        &self,
        query: &str,
        limit: Option<usize>,
        offset: Option<usize>,
    ) -> Result<Vec<SearchResult>> {
        let vector_store = self.vector_store.read().await;
        
        // Generate query embedding
        let query_embedding = vector_store.generate_embedding(query).await?;
        
        // Perform vector search
        let results = vector_store
            .search(
                &query_embedding,
                limit.unwrap_or(self.config.max_results),
                self.config.min_score,
            )
            .await?;

        // Convert to search results
        let search_results = results
            .into_iter()
            .skip(offset.unwrap_or(0))
            .map(|doc| SearchResult {
                id: doc.id,
                title: doc.title,
                content: doc.content,
                scores: SearchScores {
                    text_score: 0.0,
                    vector_score: doc.score,
                    final_score: doc.score,
                },
                metadata: DocumentMetadata::default(),
                highlights: vec![],
            })
            .collect();

        Ok(search_results)
    }

    pub async fn index_document(&self, document: &Document) -> Result<()> {
        let vector_store = self.vector_store.read().await;
        
        // Generate embeddings if not present
        let embedding = if let Some(embedding) = &document.vector_embedding {
            embedding.clone()
        } else {
            vector_store.generate_embedding(&document.content).await?
        };

        let vector_doc = VectorDocument {
            id: document.id.clone(),
            title: document.title.clone(),
            content: document.content.clone(),
            vector: embedding,
            metadata: VectorMetadata {
                content_hash: calculate_hash(&document.content),
                dimension: embedding.len(),
                source: document.metadata.source_type.clone(),
            },
        };

        vector_store.add_document(&vector_doc).await?;
        Ok(())
    }

    pub async fn get_document(&self, id: &str) -> Result<Option<Document>> {
        let vector_store = self.vector_store.read().await;
        
        if let Some(doc) = vector_store.get_document(id).await? {
            Ok(Some(Document {
                id: doc.id,
                title: doc.title,
                content: doc.content,
                content_type: "text".to_string(),
                vector_embedding: Some(doc.vector),
                metadata: DocumentMetadata::default(),
            }))
        } else {
            Ok(None)
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct SearchResult {
    pub id: String,
    pub title: String,
    pub content: String,
    pub scores: SearchScores,
    pub metadata: DocumentMetadata,
    pub highlights: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct SearchScores {
    pub text_score: f32,
    pub vector_score: f32,
    pub final_score: f32,
}

fn calculate_hash(content: &str) -> String {
    use sha2::{Sha256, Digest};
    let mut hasher = Sha256::new();
    hasher.update(content.as_bytes());
    format!("{:x}", hasher.finalize())
}
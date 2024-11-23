// src/vector/store.rs

use crate::document::{Document, DocumentMetadata};
use crate::search::types::{SearchResult, SearchScores};
use anyhow::{Result, Context};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use uuid::Uuid;
use chrono::Utc;
use ndarray::Array1;

pub struct VectorStore {
    documents: HashMap<String, Document>,
    embeddings: HashMap<String, Vec<f32>>,
    dimension: usize,
}

impl VectorStore {
    pub async fn new() -> Result<Self> {
        Ok(Self {
            documents: HashMap::new(),
            embeddings: HashMap::new(),
            dimension: 384, // Default dimension for the model
        })
    }

    pub async fn add_document(&mut self, document: &Document) -> Result<()> {
        if let Some(embedding) = &document.vector_embedding {
            self.documents.insert(document.id.clone(), document.clone());
            self.embeddings.insert(document.id.clone(), embedding.clone());
        }
        Ok(())
    }

    pub async fn get_document(&self, id: &str) -> Result<Option<Document>> {
        Ok(self.documents.get(id).cloned())
    }

    pub async fn search(
        &self,
        query: &str,
        limit: usize,
        threshold: f32,
    ) -> Result<Vec<SearchResult>> {
        // For now, return all documents sorted by creation date
        let mut results: Vec<_> = self.documents
            .values()
            .map(|doc| {
                SearchResult {
                    id: Uuid::parse_str(&doc.id).unwrap_or_default(),
                    title: doc.title.clone(),
                    content: doc.content.clone(),
                    author: doc.metadata.author.clone(),
                    scores: SearchScores {
                        text_score: 1.0,
                        vector_score: 1.0,
                        final_score: 1.0,
                    },
                    metadata: doc.metadata.clone(),
                    highlights: vec![],
                }
            })
            .collect();

        results.sort_by(|a, b| b.metadata.created_at.cmp(&a.metadata.created_at));
        results.truncate(limit);

        Ok(results)
    }

    pub async fn generate_embedding(&self, text: &str) -> Result<Vec<f32>> {
        // Placeholder: return a random vector of the correct dimension
        Ok((0..self.dimension).map(|_| rand::random()).collect())
    }
}
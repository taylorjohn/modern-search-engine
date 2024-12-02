use anyhow::Result;
use std::sync::Arc;
use tokio::sync::RwLock;
use std::time::Instant;
use crate::vector::store::VectorStore;
use crate::document::Document;
use crate::config::SearchConfig;

pub struct SearchEngine {
    vector_store: Arc<RwLock<VectorStore>>,
    config: SearchConfig,
}

impl SearchEngine {
    pub fn new(vector_store: Arc<RwLock<VectorStore>>, config: SearchConfig) -> Self {
        Self { vector_store, config }
    }

    pub async fn search(
        &self,
        query: &str,
        limit: Option<usize>,
        offset: Option<usize>,
    ) -> Result<Vec<Document>> {
        let start_time = Instant::now();
        let vector_store = self.vector_store.read().await;
        
        // Create simple query vector (replace with actual embedding later)
        let query_vector = vec![0.1; 384];
        
        let mut docs = vector_store.search(
            &query_vector,
            limit.unwrap_or(self.config.max_results),
        ).await?;

        // Skip offset if specified
        if let Some(offset) = offset {
            docs = docs.into_iter().skip(offset).collect();
        }

        // Add highlights and scores
        for doc in &mut docs {
            // Simple text matching score
            let text_score = if doc.content.to_lowercase().contains(&query.to_lowercase()) {
                1.0
            } else {
                0.0
            };

            // Get vector similarity score from the vector store
            let vector_score = 0.8; // This should come from vector similarity calculation

            // Calculate final score
            let final_score = (text_score * self.config.text_weight + 
                             vector_score * self.config.vector_weight) /
                             (self.config.text_weight + self.config.vector_weight);

            // Add scores to document
            doc.scores.text_score = text_score;
            doc.scores.vector_score = vector_score;
            doc.scores.final_score = final_score;

            // Add highlights
            if text_score > 0.0 {
                let highlighted = doc.content.replace(
                    query,
                    &format!("<em>{}</em>", query)
                );
                doc.highlights.push(highlighted);
            }
        }

        // Sort by final score
        docs.sort_by(|a, b| b.scores.final_score.partial_cmp(&a.scores.final_score).unwrap());

        // Track execution time
        let duration = start_time.elapsed();
        println!("Search completed in {:?}", duration);

        Ok(docs)
    }

    pub async fn index_document(&self, document: &Document) -> Result<()> {
        let mut vector_store = self.vector_store.write().await;
        vector_store.add_document(document).await?;
        println!("Indexed document: {} - {}", document.id, document.title);
        Ok(())
    }
}
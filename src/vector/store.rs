// vector_search.rs
use rust_bert::pipelines::sentence_embeddings::{SentenceEmbeddingsBuilder, SentenceEmbeddingsModel};
use ndarray::{Array1, ArrayView1};
use serde::{Serialize, Deserialize};
use std::sync::Arc;
use anyhow::Result;

#[derive(Debug, Serialize, Deserialize)]
pub struct DocumentVector {
    pub id: String,
    pub vector: Vec<f32>,
    pub metadata: DocumentMetadata,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DocumentMetadata {
    pub title: String,
    pub content: String,
    pub author: String,
    pub tags: Vec<String>,
}

pub struct VectorStore {
    model: Arc<SentenceEmbeddingsModel>,
    vectors: Vec<DocumentVector>,
    dimension: usize,
}

impl VectorStore {
    pub async fn new() -> Result<Self> {
        let model = SentenceEmbeddingsBuilder::local("all-MiniLM-L6-v2")
            .create_model()?;

        Ok(Self {
            model: Arc::new(model),
            vectors: Vec::new(),
            dimension: 384, // MiniLM dimension
        })
    }

    pub async fn add_document(&mut self, 
        id: String, 
        content: String, 
        metadata: DocumentMetadata
    ) -> Result<()> {
        let embedding = self.generate_embedding(&content).await?;
        
        self.vectors.push(DocumentVector {
            id,
            vector: embedding.to_vec(),
            metadata,
        });

        Ok(())
    }

    async fn generate_embedding(&self, text: &str) -> Result<Vec<f32>> {
        let embeddings = self.model.encode(&[text])?;
        Ok(embeddings[0].clone())
    }

    pub async fn search(
        &self,
        query: &str,
        num_results: usize,
        threshold: f32,
    ) -> Result<Vec<ScoredDocument>> {
        let query_embedding = self.generate_embedding(query).await?;
        let query_vector = Array1::from(query_embedding);

        let mut scored_docs: Vec<ScoredDocument> = self.vectors
            .iter()
            .map(|doc| {
                let doc_vector = Array1::from(doc.vector.clone());
                let similarity = cosine_similarity(
                    query_vector.view(),
                    doc_vector.view(),
                );

                ScoredDocument {
                    id: doc.id.clone(),
                    metadata: doc.metadata.clone(),
                    score: similarity,
                }
            })
            .filter(|doc| doc.score >= threshold)
            .collect();

        scored_docs.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap());
        Ok(scored_docs.into_iter().take(num_results).collect())
    }
}

#[derive(Debug, Serialize)]
pub struct ScoredDocument {
    pub id: String,
    pub metadata: DocumentMetadata,
    pub score: f32,
}

// Hybrid search implementation combining vector and keyword search
pub struct HybridSearch {
    vector_store: Arc<tokio::sync::RwLock<VectorStore>>,
    tantivy_index: Arc<tantivy::Index>,
}

impl HybridSearch {
    pub async fn new(tantivy_index: Arc<tantivy::Index>) -> Result<Self> {
        let vector_store = Arc::new(tokio::sync::RwLock::new(
            VectorStore::new().await?
        ));

        Ok(Self {
            vector_store,
            tantivy_index,
        })
    }

    pub async fn search(
        &self,
        query: &str,
        num_results: usize,
    ) -> Result<Vec<HybridSearchResult>> {
        // Perform vector search
        let vector_results = self.vector_store.read().await
            .search(query, num_results, 0.5).await?;

        // Perform keyword search
        let reader = self.tantivy_index.reader()?;
        let searcher = reader.searcher();
        let query_parser = tantivy::query::QueryParser::new(
            self.tantivy_index.schema(),
            vec![],
            tantivy::query::QueryParserOptions::default(),
        );
        let query = query_parser.parse_query(query)?;
        let keyword_results = searcher.search(&query, &tantivy::collector::TopDocs::with_limit(num_results))?;

        // Combine and score results
        let mut hybrid_results = self.combine_results(vector_results, keyword_results).await?;
        hybrid_results.sort_by(|a, b| b.final_score.partial_cmp(&a.final_score).unwrap());

        Ok(hybrid_results.into_iter().take(num_results).collect())
    }

    async fn combine_results(
        &self,
        vector_results: Vec<ScoredDocument>,
        keyword_results: Vec<(f32, tantivy::DocAddress)>,
    ) -> Result<Vec<HybridSearchResult>> {
        let mut hybrid_results = Vec::new();

        // Normalize scores
        let max_vector_score = vector_results.iter()
            .map(|r| r.score)
            .fold(0f32, f32::max);
        let max_keyword_score = keyword_results.iter()
            .map(|(score, _)| *score)
            .fold(0f32, f32::max);

        // Weight configuration
        const VECTOR_WEIGHT: f32 = 0.6;
        const KEYWORD_WEIGHT: f32 = 0.4;

        // Combine results
        for vector_result in vector_results {
            let normalized_vector_score = vector_result.score / max_vector_score;
            
            // Find corresponding keyword result
            let keyword_score = keyword_results.iter()
                .find(|(_, doc_addr)| {
                    // Match documents based on ID or other criteria
                    true // Implement proper matching logic
                })
                .map(|(score, _)| score / max_keyword_score)
                .unwrap_or(0.0);

            let final_score = (normalized_vector_score * VECTOR_WEIGHT) +
                            (keyword_score * KEYWORD_WEIGHT);

            hybrid_results.push(HybridSearchResult {
                id: vector_result.id,
                metadata: vector_result.metadata,
                vector_score: normalized_vector_score,
                keyword_score,
                final_score,
            });
        }

        Ok(hybrid_results)
    }
}

#[derive(Debug, Serialize)]
pub struct HybridSearchResult {
    pub id: String,
    pub metadata: DocumentMetadata,
    pub vector_score: f32,
    pub keyword_score: f32,
    pub final_score: f32,
}

// Helper function for cosine similarity
fn cosine_similarity(a: ArrayView1<f32>, b: ArrayView1<f32>) -> f32 {
    let dot_product = a.dot(&b);
    let norm_a = (a.dot(&a)).sqrt();
    let norm_b = (b.dot(&b)).sqrt();
    dot_product / (norm_a * norm_b)
}

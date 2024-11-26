use rust_bert::pipelines::sentence_embeddings::{
    SentenceEmbeddingsBuilder, SentenceEmbeddingsModel,
};
use anyhow::Result;
use std::sync::Arc;
use rayon::slice::ParallelSlice;
use rayon::iter::IntoParallelRefIterator;

pub struct EmbeddingGenerator {
    model: Arc<SentenceEmbeddingsModel>,
}

impl EmbeddingGenerator {
    pub fn new() -> Result<Self> {
        let model = SentenceEmbeddingsBuilder::local("all-MiniLM-L6-v2")
            .with_device(rust_bert::RustBertError::Torch("cpu".to_string()))  // Use CPU by default
            .create_model()?;

        Ok(Self {
            model: Arc::new(model),
        })
    }

    pub async fn generate(&self, text: &str) -> Result<Vec<f32>> {
        // Split long texts into chunks to avoid memory issues
        let chunks = self.split_text(text);
        let embeddings = self.model.encode(&chunks)?;
        
        // If we split the text, average the embeddings
        if chunks.len() > 1 {
            let sum: Vec<f32> = embeddings.iter().fold(vec![0.0; embeddings[0].len()], |mut acc, emb| {
                for (a, &b) in acc.iter_mut().zip(emb.iter()) {
                    *a += b;
                }
                acc
            });
            
            let avg: Vec<f32> = sum.into_iter()
                .map(|x| x / embeddings.len() as f32)
                .collect();
                
            Ok(avg)
        } else {
            Ok(embeddings[0].clone())
        }
    }

    pub async fn batch_generate(&self, texts: &[String]) -> Result<Vec<Vec<f32>>> {
        let mut results = Vec::new();
        
        // Process in batches to manage memory
        for chunk in texts.par_chunks(32) {
            let embeddings = self.model.encode(chunk)?;
            results.extend(embeddings);
        }
        
        Ok(results)
    }

    fn split_text(&self, text: &str) -> Vec<String> {
        // Split long texts into chunks of roughly 512 tokens
        // This is a simple implementation - you might want to split more intelligently
        let max_chunk_size = 512;
        let words: Vec<&str> = text.split_whitespace().collect();
        
        if words.len() <= max_chunk_size {
            return vec![text.to_string()];
        }

        words.chunks(max_chunk_size)
            .map(|chunk| chunk.join(" "))
            .collect()
    }

    pub fn dimension(&self) -> usize {
        384 // MiniLM dimension
    }
}

pub fn cosine_similarity(a: &[f32], b: &[f32]) -> f32 {
    let dot_product: f32 = a.iter().zip(b.iter()).map(|(x, y)| x * y).sum();
    let norm_a: f32 = a.iter().map(|x| x * x).sum::<f32>().sqrt();
    let norm_b: f32 = b.iter().map(|x| x * x).sum::<f32>().sqrt();
    
    if norm_a == 0.0 || norm_b == 0.0 {
        0.0
    } else {
        dot_product / (norm_a * norm_b)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_embedding_generation() {
        let generator = EmbeddingGenerator::new().unwrap();
        let embedding = generator.generate("test text").await.unwrap();
        assert_eq!(embedding.len(), generator.dimension());
    }

    #[test]
    fn test_cosine_similarity() {
        let a = vec![1.0, 0.0, 0.0];
        let b = vec![0.0, 1.0, 0.0];
        assert_eq!(cosine_similarity(&a, &b), 0.0);

        let c = vec![1.0, 0.0, 0.0];
        let d = vec![1.0, 0.0, 0.0];
        assert_eq!(cosine_similarity(&c, &d), 1.0);
    }
}
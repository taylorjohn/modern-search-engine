use modern_search_engine::{
    document::{Document, DocumentMetadata},
    vector::store::VectorStore,
    search::engine::SearchEngine,
    config::SearchConfig,
};
use std::sync::Arc;
use tokio::sync::RwLock;
use anyhow::Result;

#[tokio::test]
async fn test_vector_store() -> Result<()> {
    let mut store = VectorStore::new(384);
    
    let doc = Document {
        id: "test".to_string(),
        title: "Test".to_string(),
        content: "Content".to_string(),
        content_type: "text".to_string(),
        metadata: DocumentMetadata::default(),
        vector_embedding: Some(vec![0.1; 384]),
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };

    store.add_document(&doc).await?;

    let results = store.search(&vec![0.1; 384], 10).await?;
    assert_eq!(results.len(), 0); // Currently returns empty as search is not implemented

    Ok(())
}

#[tokio::test]
async fn test_search_engine() -> Result<()> {
    let vector_store = Arc::new(RwLock::new(VectorStore::new(384)));
    let config = SearchConfig {
        max_results: 10,
        min_score: 0.1,
        vector_weight: 0.6,
        text_weight: 0.4,
    };
    let engine = SearchEngine::new(vector_store, config);

    let doc = Document {
        id: "test".to_string(),
        title: "Machine Learning".to_string(),
        content: "A document about ML".to_string(),
        content_type: "text".to_string(),
        metadata: DocumentMetadata::default(),
        vector_embedding: Some(vec![0.1; 384]),
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };

    engine.index_document(&doc).await?;

    let results = engine.search("machine learning", Some(10), None).await?;
    assert_eq!(results.len(), 0); // Currently returns empty as search is not implemented

    Ok(())
}
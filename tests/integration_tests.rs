use anyhow::Result;
use modern_search_engine::{
    api::types::{SearchResult, DocumentUpload},
    config::{Config, SearchConfig},
    document::{DocumentMetadata, DocumentProcessor},
    search::engine::SearchEngine,
    vector::store::VectorStore,
};
use std::sync::Arc;
use tokio::sync::RwLock;

#[tokio::test]
async fn test_basic_flow() -> Result<()> {
    // Setup components
    let vector_store = Arc::new(RwLock::new(VectorStore::new(384)));
    let config = Config::default();
    let engine = Arc::new(SearchEngine::new(vector_store.clone(), config.search));
    let processor = Arc::new(DocumentProcessor::new(vector_store.clone()));

    // Test document upload
    let test_doc = DocumentUpload::Text {
        content: "This is a test document about machine learning".to_string(),
        title: "Test Doc".to_string(),
        metadata: None,
    };

    let doc_id = processor.process_document(test_doc).await?;
    assert!(!doc_id.is_empty());

    // Test search
    let results = engine.search("machine learning", Some(10), None).await?;
    assert!(!results.is_empty());

    Ok(())
}
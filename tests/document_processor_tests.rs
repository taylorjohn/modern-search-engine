use modern_search_engine::{
    document::{DocumentProcessor, DocumentUpload},
    vector::store::VectorStore,
};
use std::sync::Arc;
use tokio::sync::RwLock;
use anyhow::Result;

#[tokio::test]
async fn test_document_processing() -> Result<()> {
    let vector_store = Arc::new(RwLock::new(VectorStore::new(384)));
    let processor = DocumentProcessor::new(vector_store);

    let upload = DocumentUpload::Text {
        content: "Test content".to_string(),
        title: "Test Document".to_string(),
        metadata: None,
    };

    let doc_id = processor.process_document(upload).await?;
    assert!(!doc_id.is_empty());

    Ok(())
}
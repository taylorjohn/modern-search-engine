use modern_search_engine::document::{
    ingestion::DocumentIngester, processor::DocumentProcessor, store::DocumentStore,
};

use std::sync::Arc;
use tokio::sync::RwLock;

#[tokio::test]
async fn test_document_processing() {
    let processor = setup_test_processor().await;

    // Test PDF processing
    let pdf_content = include_bytes!("../test_data/test.pdf");
    let pdf_doc = DocumentUpload::Pdf {
        base64_content: base64::encode(pdf_content),
        filename: "test.pdf".to_string(),
        metadata: None,
    };

    let result = processor.process_document(pdf_doc).await.unwrap();
    assert!(!result.content.is_empty());
    assert!(result.vector_embedding.len() > 0);

    // Test HTML processing
    let html_doc = DocumentUpload::Html {
        content: "<html><body>Test content</body></html>".to_string(),
        url: None,
        metadata: None,
    };

    let result = processor.process_document(html_doc).await.unwrap();
    assert_eq!(result.content.trim(), "Test content");
}

#[tokio::test]
async fn test_batch_processing() {
    let processor = setup_test_processor().await;

    let documents = vec![
        DocumentUpload::Text {
            content: "Doc 1".to_string(),
            title: "Test 1".to_string(),
            metadata: None,
        },
        DocumentUpload::Text {
            content: "Doc 2".to_string(),
            title: "Test 2".to_string(),
            metadata: None,
        },
    ];

    let results = processor.process_batch(documents, None).await.unwrap();
    assert_eq!(results.len(), 2);
}

#[tokio::test]
async fn test_document_store() {
    let store = DocumentStore::new().await.unwrap();

    // Test document storage and retrieval
    let doc_id = store
        .store_document("test content", "Test Document", vec![0.1, 0.2, 0.3])
        .await
        .unwrap();

    let retrieved = store.get_document(&doc_id).await.unwrap();
    assert_eq!(retrieved.title, "Test Document");
}

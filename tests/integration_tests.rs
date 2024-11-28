use modern_search_engine::{
    config::Config, document::processor::DocumentProcessor, search::engine::SearchEngine,
    vector::store::VectorStore,
};

use std::sync::Arc;
use tokio::sync::RwLock;
use wiremock::matchers::{method, path};
use wiremock::{Mock, MockServer, ResponseTemplate};

async fn setup_test_system() -> (Arc<SearchEngine>, Arc<DocumentProcessor>) {
    let config = Config::default();
    let vector_store = Arc::new(RwLock::new(VectorStore::new(&config).await.unwrap()));
    let search_engine = Arc::new(SearchEngine::new(vector_store.clone(), &config.search).unwrap());
    let document_processor = Arc::new(
        DocumentProcessor::new(vector_store, search_engine.clone(), &config.processor).unwrap(),
    );

    (search_engine, document_processor)
}

#[tokio::test]
async fn test_end_to_end_workflow() {
    let (search_engine, document_processor) = setup_test_system().await;

    // 1. Process and index a document
    let test_doc = DocumentUpload::Text {
        content: "This is a test document about machine learning".to_string(),
        title: "Test Document".to_string(),
        metadata: None,
    };

    let processed = document_processor.process_document(test_doc).await.unwrap();

    // 2. Perform search
    let results = search_engine
        .search("machine learning", 10, None)
        .await
        .unwrap();

    assert!(!results.is_empty());
    assert_eq!(results[0].id, processed.id);
}

#[tokio::test]
async fn test_external_api_integration() {
    let mock_server = MockServer::start().await;

    // Mock external API responses
    Mock::given(method("GET"))
        .and(path("/external/document"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "content": "External document content",
            "metadata": {
                "author": "External Author"
            }
        })))
        .mount(&mock_server)
        .await;

    // Test external document fetching and processing
    let (_, document_processor) = setup_test_system().await;

    let external_doc = DocumentUpload::Html {
        content: format!("{}/external/document", mock_server.uri()),
        url: Some("https://example.com".to_string()),
        metadata: None,
    };

    let result = document_processor
        .process_document(external_doc)
        .await
        .unwrap();
    assert!(result.content.contains("External document content"));
}

#[tokio::test]
async fn test_performance() {
    let (search_engine, document_processor) = setup_test_system().await;

    // Generate test documents
    let docs: Vec<_> = (0..100)
        .map(|i| DocumentUpload::Text {
            content: format!("Test document {} with some content", i),
            title: format!("Test {}", i),
            metadata: None,
        })
        .collect();

    // Measure indexing performance
    let start = std::time::Instant::now();
    let _results = document_processor.process_batch(docs, None).await.unwrap();
    let indexing_time = start.elapsed();

    // Measure search performance
    let start = std::time::Instant::now();
    let _results = search_engine.search("test", 10, None).await.unwrap();
    let search_time = start.elapsed();

    // Assert performance requirements
    assert!(indexing_time.as_secs_f32() / 100.0 < 0.1); // Less than 100ms per document
    assert!(search_time.as_secs_f32() < 0.1); // Less than 100ms per search
}

use modern_search_engine::{
    api::{handlers, routes},
    config::Config,
    search::engine::SearchEngine,
    document::processor::DocumentProcessor,
    vector::store::VectorStore,
};

use warp::test::request;
use serde_json::{json, Value};
use std::sync::Arc;
use tokio::sync::RwLock;

#[tokio::test]
async fn test_search_endpoint() {
    // Setup test components
    let config = Config::default();
    let vector_store = Arc::new(RwLock::new(VectorStore::new(&config).await.unwrap()));
    let search_engine = Arc::new(SearchEngine::new(vector_store.clone(), &config.search).unwrap());
    let document_processor = Arc::new(DocumentProcessor::new(
        vector_store.clone(),
        search_engine.clone(),
        &config.processor,
    ).unwrap());

    // Create test routes
    let routes = routes::create_routes(
        search_engine,
        document_processor,
        Arc::new(config),
    );

    // Test search request
    let response = request()
        .method("GET")
        .path("/search?q=test")
        .reply(&routes)
        .await;

    assert_eq!(response.status(), 200);

    let body: Value = serde_json::from_slice(response.body()).unwrap();
    assert!(body.get("results").is_some());
}

#[tokio::test]
async fn test_document_upload() {
    // Similar setup as above
    let test_doc = json!({
        "type": "text",
        "content": "Test document content",
        "title": "Test Document",
        "metadata": {
            "author": "Test Author",
            "tags": ["test", "document"]
        }
    });

    // Test upload request
    let response = request()
        .method("POST")
        .path("/documents")
        .json(&test_doc)
        .reply(&routes)
        .await;

    assert_eq!(response.status(), 200);
}

#[tokio::test]
async fn test_error_handling() {
    // Test invalid request
    let response = request()
        .method("GET")
        .path("/search")  // Missing required query parameter
        .reply(&routes)
        .await;

    assert_eq!(response.status(), 400);
}
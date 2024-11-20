use modern_search_engine::{
    search::{
        engine::SearchEngine,
        query_parser::QueryParser,
        executor::SearchExecutor,
    },
    vector::store::VectorStore,
};

use std::sync::Arc;
use tokio::sync::RwLock;

async fn setup_test_engine() -> Arc<SearchEngine> {
    let config = Config::default();
    let vector_store = Arc::new(RwLock::new(VectorStore::new(&config).await.unwrap()));
    Arc::new(SearchEngine::new(vector_store, &config.search).unwrap())
}

#[tokio::test]
async fn test_query_parsing() {
    let engine = setup_test_engine().await;
    let test_cases = vec![
        ("test query", QueryType::Text),
        ("\"exact phrase\"", QueryType::Phrase),
        ("field:value", QueryType::Field),
        ("test~2", QueryType::Fuzzy),
    ];

    for (query, expected_type) in test_cases {
        let parsed = engine.parse_query(query).unwrap();
        assert_eq!(parsed.query_type, expected_type);
    }
}

#[tokio::test]
async fn test_vector_search() {
    let engine = setup_test_engine().await;
    
    // Add test document
    let test_doc = Document {
        content: "Test vector search functionality",
        ..Default::default()
    };
    engine.index_document(&test_doc).await.unwrap();

    // Perform vector search
    let results = engine.search("vector search", 10, None).await.unwrap();
    assert!(!results.is_empty());
}

#[tokio::test]
async fn test_hybrid_search() {
    let engine = setup_test_engine().await;
    
    // Test hybrid search with different weights
    let configs = vec![
        SearchConfig { vector_weight: 0.7, text_weight: 0.3 },
        SearchConfig { vector_weight: 0.3, text_weight: 0.7 },
    ];

    for config in configs {
        let results = engine
            .search_with_config("test query", 10, None, config)
            .await
            .unwrap();
        
        assert!(!results.is_empty());
    }
}
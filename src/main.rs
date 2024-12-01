use anyhow::Result;
use modern_search_engine::{
    api::routes,
    config::Config,
    search::engine::SearchEngine,
    document::processor::DocumentProcessor,
    vector::store::VectorStore,
};
use std::sync::Arc;
use tokio::sync::RwLock;

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize logging
    tracing_subscriber::fmt::init();

    // Load config
    let config = Config::default();

    // Setup vector store
    let vector_store = Arc::new(RwLock::new(VectorStore::new(384)));  // 384 is the embedding dimension

    // Setup search engine and document processor
    let engine = Arc::new(SearchEngine::new(vector_store.clone(), config.search));
    let processor = Arc::new(DocumentProcessor::new(vector_store));

    // Create routes
    let routes = routes::create_routes(engine, processor);

    // Start server
    println!("Server starting on http://127.0.0.1:3030");
    warp::serve(routes)
        .run(([127, 0, 0, 1], 3030))
        .await;

    Ok(())
}
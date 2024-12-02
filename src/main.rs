use anyhow::Result;
use modern_search_engine::{
    api::routes,
    config::Config,
    search::engine::SearchEngine,
    document::processor::DocumentProcessor,
    vector::store::VectorStore,
    telemetry,
};
use std::sync::Arc;
use tokio::sync::RwLock;

#[tokio::main]
async fn main() -> Result<()> {
    // Load config
    let config = Config::default();

    // Initialize telemetry if enabled - remove the duplicate tracing init
    if config.telemetry.metrics_enabled {
        telemetry::init_telemetry(&config)?;
    }

    // Setup vector store
    let vector_store = Arc::new(RwLock::new(VectorStore::new(config.vector.dimension)));

    // Setup search engine and document processor
    let engine = Arc::new(SearchEngine::new(vector_store.clone(), config.search));
    let processor = Arc::new(DocumentProcessor::new(vector_store));

    // Create routes
    let routes = routes::create_routes(engine, processor);

    println!("Server starting on http://127.0.0.1:3030");
    
    // Add the root route
    let routes = warp::path::end()
        .map(|| warp::reply::html(include_str!("../static/index.html")))
        .or(routes);

    // Start server
    warp::serve(routes)
        .run(([127, 0, 0, 1], 3030))
        .await;

    Ok(())
}
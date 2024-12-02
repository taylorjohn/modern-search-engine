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
use warp::Filter;  // Add this import

#[tokio::main]
async fn main() -> Result<()> {
    // Load config
    let config = Config::default();

    // Initialize telemetry if enabled
    if config.telemetry.metrics_enabled {
        telemetry::init_telemetry(&config)?;
    }

    // Setup vector store
    let vector_store = Arc::new(RwLock::new(VectorStore::new(config.vector.dimension)));

    // Setup search engine and document processor
    let engine = Arc::new(SearchEngine::new(vector_store.clone(), config.search));
    let processor = Arc::new(DocumentProcessor::new(vector_store));

    // Create routes
    let api_routes = routes::create_routes(engine, processor);

    // Create the root route
    let root = warp::path::end()
        .and(warp::get())
        .map(|| warp::reply::html(include_str!("../static/index.html")));

    // Combine routes
    let routes = root.or(api_routes);

    println!("Server starting on http://127.0.0.1:3030");
    
    // Start server
    warp::serve(routes)
        .run(([127, 0, 0, 1], 3030))
        .await;

    Ok(())
}
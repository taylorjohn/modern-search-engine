use anyhow::Result;
use modern_search_engine::{
    api::routes,
    config::Config,
    search::engine::SearchEngine,
    document::DocumentProcessor,
    vector::store::VectorStore,
    telemetry,
};
use std::sync::Arc;
use tokio::sync::RwLock;
use warp::Filter;
use sqlx::PgPool;

#[tokio::main]
async fn main() -> Result<()> {
    // Load config
    let config = Config::default();

    // Initialize telemetry if enabled
    if config.telemetry.metrics_enabled {
        telemetry::init_telemetry(&config)?;
    }

    // Setup database pool
    let pool = Arc::new(
        PgPool::connect(&config.database.url)
            .await?
    );

    // Setup vector store
    let vector_store = Arc::new(RwLock::new(
        VectorStore::new(pool.clone(), config.vector.dimension)
    ));

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

    println!("Server starting on http://{}:{}", config.server.host, config.server.port);
    
    // Start server
    warp::serve(routes)
        .run(([127, 0, 0, 1], config.server.port))
        .await;

    Ok(())
}
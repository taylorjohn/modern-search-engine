use modern_search_engine::{
    api::{routes, error::handle_rejection},
    config::Config,
    search::engine::SearchEngine,
    document::processor::DocumentProcessor,
    vector::store::VectorStore,
    telemetry::{init_telemetry, MetricsCollector},
};

use std::sync::Arc;
use tokio::sync::RwLock;
use anyhow::Result;
use tracing::{info, error};

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize configuration
    let config = Config::from_env()?;

    // Initialize telemetry
    init_telemetry(&config.service_name)?;
    info!("Starting search engine v2...");

    // Initialize metrics collector
    let metrics = Arc::new(MetricsCollector::new());

    // Initialize vector store
    let vector_store = Arc::new(RwLock::new(VectorStore::new(&config).await?));
    info!("Vector store initialized");

    // Initialize search engine
    let search_engine = Arc::new(SearchEngine::new(
        vector_store.clone(),
        &config.search,
    )?);
    info!("Search engine initialized");

    // Initialize document processor
    let document_processor = Arc::new(DocumentProcessor::new(
        vector_store.clone(),
        search_engine.clone(),
        &config.processor,
    )?);
    info!("Document processor initialized");

    // Setup API routes
    let routes = routes::create_routes(
        search_engine,
        document_processor,
        metrics.clone(),
        &config,
    )
    .recover(handle_rejection);

    // Start cleanup task
    let cleanup_interval = config.cleanup_interval;
    let processor_clone = document_processor.clone();
    tokio::spawn(async move {
        loop {
            tokio::time::sleep(cleanup_interval).await;
            if let Err(e) = processor_clone.cleanup_old_tasks(24).await {
                error!("Failed to clean up old tasks: {}", e);
            }
        }
    });

    // Start metrics collection
    let metrics_clone = metrics.clone();
    tokio::spawn(async move {
        loop {
            tokio::time::sleep(std::time::Duration::from_secs(60)).await;
            metrics_clone.collect().await;
        }
    });

    // Start server
    let addr = ([127, 0, 0, 1], config.port).into();
    info!("Server listening on http://{}", addr);
    
    warp::serve(routes)
        .run(addr)
        .await;

    Ok(())
}
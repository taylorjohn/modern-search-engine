use anyhow::Result;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{info, error};
use warp::Filter;

use modern_search_engine::{
    api::{
        routes, 
        error::handle_rejection,
        types::ApiError,
    },
    config::{Config, SearchConfig},
    search::engine::SearchEngine,
    document::{
        processor::DocumentProcessor,
        store::DocumentStore,
    },
    vector::store::VectorStore,
    telemetry::init_telemetry,
};

async fn init_database() -> Result<()> {
    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://postgres:postgres@localhost:5432/modern_search".to_string());

    let pool = sqlx::postgres::PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await?;

    // Read and execute migrations
    let migration_sql = include_str!("../migrations.sql");
    sqlx::query(migration_sql).execute(&pool).await?;

    Ok(())
}

pub async fn setup_search_system(config: &Config) -> Result<(Arc<DocumentProcessor>, Arc<SearchEngine>)> {
    // Initialize document store
    let document_store = Arc::new(RwLock::new(DocumentStore::new().await?));
    info!("Document store initialized");

    // Initialize vector store
    let vector_store = Arc::new(RwLock::new(VectorStore::new().await?));
    info!("Vector store initialized");

    // Initialize search engine
    let search_engine = Arc::new(SearchEngine::new(
        vector_store.clone(),
        SearchConfig::default(),
    ));
    info!("Search engine initialized");

    // Initialize document processor
    let document_processor = Arc::new(DocumentProcessor::new(
        document_store,
        vector_store,
        search_engine.clone(),
    ));
    info!("Document processor initialized");

    Ok((document_processor, search_engine))
}

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize configuration
    let config = Config::from_env()?;

    // Initialize telemetry
    init_telemetry(&config)?;
    info!("Starting search engine v2...");

    // Initialize database
    init_database().await?;
    info!("Database initialized");

    // Setup core components
    let (document_processor, search_engine) = setup_search_system(&config).await?;

    // Setup API routes
    let routes = routes::create_routes(
        search_engine.clone(),
        document_processor.clone(),
    )
    .recover(handle_rejection);

    // Start cleanup task
    let cleanup_interval = std::time::Duration::from_secs(3600); // 1 hour
    let processor_clone = document_processor.clone();
    tokio::spawn(async move {
        loop {
            tokio::time::sleep(cleanup_interval).await;
            if let Err(e) = processor_clone.cleanup_old_tasks(24).await {
                error!("Failed to clean up old tasks: {}", e);
            }
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

// Helper function to convert anyhow errors to ApiError
fn convert_error(err: anyhow::Error) -> ApiError {
    match err.downcast::<ApiError>() {
        Ok(api_error) => api_error,
        Err(err) => ApiError::Internal(err.to_string()),
    }
}
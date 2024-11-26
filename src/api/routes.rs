// src/api/routes.rs
use warp::{Filter, Reply, Rejection};
use std::sync::Arc;
use anyhow::Result;
use crate::search::engine::SearchEngine;
use crate::document::processor::DocumentProcessor;
use crate::api::handlers::{handle_search, handle_document_upload, handle_status_check};
use crate::api::error::ApiError;
use crate::document::types::DocumentUpload;

// Helper filter functions
pub fn with_search_engine(
    engine: Arc<SearchEngine>,
) -> impl Filter<Extract = (Arc<SearchEngine>,), Error = std::convert::Infallible> + Clone {
    warp::any().map(move || engine.clone())
}

pub fn with_document_processor(
    processor: Arc<DocumentProcessor>,
) -> impl Filter<Extract = (Arc<DocumentProcessor>,), Error = std::convert::Infallible> + Clone {
    warp::any().map(move || processor.clone())
}

pub fn create_routes(
    processor: Arc<DocumentProcessor>,
    search_engine: Arc<SearchEngine>,
) -> impl Filter<Extract = impl Reply, Error = Rejection> + Clone {
    let search = warp::path("search")
        .and(warp::get())
        .and(warp::query())
        .and(with_search_engine(search_engine.clone()))
        .and_then(handle_search);

    let upload = warp::path("documents")
        .and(warp::post())
        .and(warp::body::json())
        .and(with_document_processor(processor.clone()))
        .and_then(handle_document_upload);

    let status = warp::path!("documents" / "status" / String)
        .and(warp::get())
        .and(with_document_processor(processor.clone()))
        .and_then(handle_status_check);

    search.or(upload).or(status)
}

// Create helper function for setting up search system
pub async fn setup_search_system() -> Result<(Arc<DocumentProcessor>, Arc<SearchEngine>)> {
    use crate::config::Config;
    use sqlx::postgres::PgPoolOptions;

    // Load config
    let config = Config::new()?;

    // Create database pool
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&config.database.url)
        .await?;

    // Initialize vector store
    let vector_store = Arc::new(tokio::sync::RwLock::new(
        crate::vector::store::VectorStore::new(pool.clone(), 384).await?
    ));

    // Create search engine
    let search_engine = Arc::new(SearchEngine::new(
        vector_store.clone(),
        config.search.clone(),
    )?);

    // Create document processor
    let processor = Arc::new(DocumentProcessor::new(
        vector_store,
        search_engine.clone(),
    ));

    Ok((processor, search_engine))
}

// Application entry point
#[tokio::main]
async fn main() -> Result<()> {
    // Initialize tracing
    use tracing_subscriber::{fmt, EnvFilter};
    fmt()
        .with_env_filter(EnvFilter::from_default_env())
        .init();

    // Setup search system
    let (processor, search_engine) = setup_search_system().await?;

    // Create routes
    let routes = create_routes(processor, search_engine);

    // Add error handling
    let routes = routes.recover(handle_rejection);

    // Start server
    println!("Starting server on http://127.0.0.1:3030");
    warp::serve(routes)
        .run(([127, 0, 0, 1], 3030))
        .await;

    Ok(())
}

// Error handling
async fn handle_rejection(err: Rejection) -> Result<impl Reply, Rejection> {
    if err.is_not_found() {
        Ok(warp::reply::with_status(
            warp::reply::json(&serde_json::json!({
                "error": "Not Found",
                "code": "NOT_FOUND"
            })),
            warp::http::StatusCode::NOT_FOUND,
        ))
    } else if let Some(e) = err.find::<ApiError>() {
        Ok(warp::reply::with_status(
            warp::reply::json(&serde_json::json!({
                "error": e.to_string(),
                "code": "API_ERROR"
            })),
            warp::http::StatusCode::BAD_REQUEST,
        ))
    } else {
        Ok(warp::reply::with_status(
            warp::reply::json(&serde_json::json!({
                "error": "Internal Server Error",
                "code": "INTERNAL_ERROR"
            })),
            warp::http::StatusCode::INTERNAL_SERVER_ERROR,
        ))
    }
}
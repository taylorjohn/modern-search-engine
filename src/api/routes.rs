use warp::{Filter, Reply, Rejection};
use std::sync::Arc;
use crate::search::engine::SearchEngine;
use crate::document::processor::DocumentProcessor;
use crate::api::handlers::{handle_search, handle_document_upload, handle_status_check};
use crate::api::filters::{with_search_engine, with_document_processor};

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

async fn handle_upload<IntegratedProcessor>(
    upload: DocumentUpload,
    processor: Arc<IntegratedProcessor>,
) -> Result<impl Reply, Rejection> {
    match processor.process_and_index(upload).await {
        Ok(processed) => Ok(warp::reply::json(&processed)),
        Err(e) => Err(warp::reject::custom(ApiError(e.to_string()))),
    }
}

// main.rs
#[tokio::main]
async fn main() -> Result<(), E> {
    // Setup search system
    let (processor, search_executor) = setup_search_system().await?;

    // Create routes
    let routes = create_routes(processor, search_executor);

    // Start server
    warp::serve(routes)
        .run(([127, 0, 0, 1], 3030))
        .await;

    Ok(())
}

// routes.rs
use warp::{Filter, Reply, Rejection};
use std::sync::Arc;
use crate::search::SearchExecutor;
use crate::api::handlers::SearchQuery;
use crate::api::handle_search;
use crate::document::processor::DocumentUpload;

pub fn create_routes<IntegratedProcessor>(
    processor: Arc<IntegratedProcessor>,
    search_executor: Arc<SearchExecutor>,
) -> impl Filter<Extract = impl Reply, Error = Rejection> + Clone {
    let search = warp::path("search")
        .and(warp::get())
        .and(warp::query::<SearchQuery>())
        .and(with_search_executor(search_executor.clone()))
        .and_then(handle_search);

    let upload = warp::path("documents")
        .and(warp::post())
        .and(warp::body::json())
        .and(with_processor(processor.clone()))
        .and_then(handle_upload);

    let status = warp::path!("documents" / "status" / String)
        .and(warp::get())
        .and(with_processor(processor.clone()))
        .and_then(handle_status);

    search.or(upload).or(status)
}

async fn handle_upload(
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
async fn main() -> Result<()> {
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

use std::sync::Arc;
use std::convert::Infallible;
use warp::{Filter, Reply, Rejection};
use crate::search::engine::SearchEngine;
use crate::document::DocumentProcessor;
use crate::api::handlers::{handle_search, handle_document_upload};
use crate::api::error::ApiError;
use serde_json::json;

pub fn create_routes(
    engine: Arc<SearchEngine>,
    processor: Arc<DocumentProcessor>,
) -> impl Filter<Extract = impl Reply, Error = Infallible> + Clone {
    let search = warp::path("search")
        .and(warp::get())
        .and(warp::query())
        .and(with_search_engine(engine.clone()))
        .and_then(handle_search);

    let upload = warp::path("documents")
        .and(warp::post())
        .and(warp::body::json())
        .and(with_document_processor(processor.clone()))
        .and_then(handle_document_upload);

    search.or(upload).recover(handle_rejection)
}

fn with_search_engine(
    engine: Arc<SearchEngine>
) -> impl Filter<Extract = (Arc<SearchEngine>,), Error = Infallible> + Clone {
    warp::any().map(move || engine.clone())
}

fn with_document_processor(
    processor: Arc<DocumentProcessor>
) -> impl Filter<Extract = (Arc<DocumentProcessor>,), Error = Infallible> + Clone {
    warp::any().map(move || processor.clone())
}

async fn handle_rejection(err: Rejection) -> Result<impl Reply, Infallible> {
    let (code, error_message) = if err.is_not_found() {
        (warp::http::StatusCode::NOT_FOUND, "Not Found".to_string())
    } else if let Some(e) = err.find::<ApiError>() {
        (warp::http::StatusCode::BAD_REQUEST, e.to_string())
    } else if let Some(e) = err.find::<warp::filters::body::BodyDeserializeError>() {
        (warp::http::StatusCode::BAD_REQUEST, format!("Request body deserialize error: {}", e))
    } else {
        eprintln!("unhandled error: {:?}", err);
        (warp::http::StatusCode::INTERNAL_SERVER_ERROR, "Internal Server Error".to_string())
    };

    Ok(warp::reply::with_status(
        warp::reply::json(&json!({
            "error": error_message
        })),
        code,
    ))
}
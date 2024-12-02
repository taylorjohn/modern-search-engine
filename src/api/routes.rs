use std::sync::Arc;
use warp::{Filter, Reply, Rejection};
use crate::search::engine::SearchEngine;
use crate::document::{DocumentProcessor, DocumentUpload};
use crate::api::handlers::{handle_search, handle_document_upload};
use crate::api::error::ApiError;

pub fn create_routes(
    engine: Arc<SearchEngine>,
    processor: Arc<DocumentProcessor>,
) -> impl Filter<Extract = impl Reply, Error = Rejection> + Clone {
    let search = warp::path("search")
        .and(warp::get())
        .and(warp::query())
        .and(with_search_engine(engine.clone()))
        .and_then(handle_search)
        .recover(handle_rejection);

    let upload = warp::path("documents")
        .and(warp::post())
        .and(warp::body::json())
        .and(with_document_processor(processor.clone()))
        .and_then(handle_document_upload)
        .recover(handle_rejection);

    search.or(upload)
}

fn with_search_engine(
    engine: Arc<SearchEngine>
) -> impl Filter<Extract = (Arc<SearchEngine>,), Error = std::convert::Infallible> + Clone {
    warp::any().map(move || engine.clone())
}

fn with_document_processor(
    processor: Arc<DocumentProcessor>
) -> impl Filter<Extract = (Arc<DocumentProcessor>,), Error = std::convert::Infallible> + Clone {
    warp::any().map(move || processor.clone())
}

async fn handle_rejection(err: Rejection) -> Result<impl Reply, std::convert::Infallible> {
    let code;
    let message;

    if err.is_not_found() {
        code = warp::http::StatusCode::NOT_FOUND;
        message = "Not Found";
    } else if let Some(e) = err.find::<ApiError>() {
        code = warp::http::StatusCode::BAD_REQUEST;
        message = e.to_string();
    } else if let Some(e) = err.find::<warp::filters::body::BodyDeserializeError>() {
        code = warp::http::StatusCode::BAD_REQUEST;
        message = format!("Request body deserialize error: {}", e);
    } else {
        eprintln!("unhandled error: {:?}", err);
        code = warp::http::StatusCode::INTERNAL_SERVER_ERROR;
        message = "Internal Server Error";
    }

    Ok(warp::reply::with_status(
        warp::reply::json(&serde_json::json!({
            "error": message
        })),
        code,
    ))
}
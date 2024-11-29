use std::sync::Arc;
use warp::{Filter, Reply, Rejection};
use crate::search::SearchEngine;
use crate::document::DocumentProcessor;
use crate::api::handlers::{handle_search, handle_document_upload};

pub fn create_routes(
    engine: Arc<SearchEngine>,
    processor: Arc<DocumentProcessor>,
) -> impl Filter<Extract = impl Reply, Error = Rejection> + Clone {
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

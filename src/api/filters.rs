use std::sync::Arc;
use warp::Filter;
use crate::search::engine::SearchEngine;
use crate::document::processor::DocumentProcessor;

pub fn with_document_processor(
    processor: Arc<DocumentProcessor>
) -> impl Filter<Extract = (Arc<DocumentProcessor>,), Error = std::convert::Infallible> + Clone {
    warp::any().map(move || processor.clone())
}

pub fn with_search_engine(
    engine: Arc<SearchEngine>
) -> impl Filter<Extract = (Arc<SearchEngine>,), Error = std::convert::Infallible> + Clone {
    warp::any().map(move || engine.clone())
}

pub fn json_body<T>() -> impl Filter<Extract = (T,), Error = warp::Rejection> + Clone
where
    T: Send + std::marker::Sync + for<'de> serde::Deserialize<'de>,
{
    warp::body::content_length_limit(1024 * 16)
        .and(warp::body::json())
}
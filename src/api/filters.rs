use warp::Filter;
use std::sync::Arc;
use crate::document::DocumentStore;
use crate::search::SearchEngine;

pub fn with_store(
    store: Arc<DocumentStore>,
) -> impl Filter<Extract = (Arc<DocumentStore>,), Error = std::convert::Infallible> + Clone {
    warp::any().map(move || store.clone())
}

pub fn with_search_engine(
    engine: Arc<SearchEngine>,
) -> impl Filter<Extract = (Arc<SearchEngine>,), Error = std::convert::Infallible> + Clone {
    warp::any().map(move || engine.clone())
}
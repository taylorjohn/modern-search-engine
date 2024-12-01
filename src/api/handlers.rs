use crate::document::DocumentProcessor;
use crate::document::DocumentUpload;
use crate::search::engine::SearchEngine;
use crate::api::types::{SearchQuery, SearchResponse, SearchResult, SearchAnalytics, QueryInfo, SearchMetadata};
use crate::api::ApiError;
use std::sync::Arc;

pub async fn handle_search(
    query: SearchQuery, 
    engine: Arc<SearchEngine>
) -> Result<impl warp::Reply, warp::Rejection> {
    let results = engine.search(&query.q, Some(query.limit), Some(query.offset))
        .await
        .map_err(|e| warp::reject::custom(ApiError::SearchError(e)))?;

    let total_count = results.len();
    
    let search_results: Vec<SearchResult> = results.into_iter().map(|doc| {
        let word_count = doc.content.split_whitespace().count();
        SearchResult {
            id: doc.id.clone(),
            title: doc.title.clone(),
            content: doc.content,
            scores: Default::default(),
            metadata: SearchMetadata {
                source_type: doc.metadata.source_type,
                author: doc.metadata.author,
                created_at: doc.created_at,
                word_count,
            },
            highlights: vec![],
        }
    }).collect();
    
    Ok(warp::reply::json(&SearchResponse {
        query: QueryInfo {
            original: query.q.clone(),
            expanded: query.q,
            vector_query: true,
        },
        results: search_results,
        analytics: SearchAnalytics {
            execution_time_ms: 0,
            total_results: total_count,
            max_score: 1.0,
            search_type: "hybrid".to_string(),
            vector_query: true,
        },
    }))
}

pub async fn handle_document_upload(
    upload: DocumentUpload,
    processor: Arc<DocumentProcessor>,
) -> Result<impl warp::Reply, warp::Rejection> {
    let result = processor.process_document(upload)
        .await
        .map_err(|e| warp::reject::custom(ApiError::ProcessingError(e)))?;
    
    Ok(warp::reply::json(&result))
}
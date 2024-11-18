// search_handler.rs
use warp::Reply;
use serde_json::json;
use crate::vector_search::{HybridSearch, HybridSearchResult};
use anyhow::Result;

pub async fn handle_search(
    query: std::collections::HashMap<String, String>,
    hybrid_search: Arc<HybridSearch>,
) -> Result<impl Reply, Rejection> {
    let query_text = query.get("q").unwrap_or(&String::new());
    let start_time = std::time::Instant::now();

    // Perform hybrid search
    let results = hybrid_search.search(query_text, 10).await
        .map_err(|e| warp::reject::custom(SearchError(e.to_string())))?;

    // Format response with detailed scoring
    let response = json!({
        "query": {
            "original": query_text,
            "embedding": "Generated vector representation", // You might want to include actual embedding
        },
        "results": results.iter().map(|r| {
            json!({
                "id": r.id,
                "title": r.metadata.title,
                "content": r.metadata.content,
                "author": r.metadata.author,
                "tags": r.metadata.tags,
                "scores": {
                    "vector": r.vector_score,
                    "keyword": r.keyword_score,
                    "final": r.final_score
                }
            })
        }).collect::<Vec<_>>(),
        "analytics": {
            "executionTimeMs": start_time.elapsed().as_millis(),
            "totalResults": results.len(),
            "searchType": "hybrid",
            "weights": {
                "vector": 0.6,
                "keyword": 0.4
            }
        }
    });

    Ok(warp::reply::json(&response))
}

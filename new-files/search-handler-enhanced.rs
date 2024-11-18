// search_handler.rs
use warp::Reply;
use serde_json::json;
use crate::query_parser::{QueryParser, ParsedQuery};
use crate::search_executor::SearchExecutor;

pub async fn handle_search(
    query: std::collections::HashMap<String, String>,
    index: Arc<Index>,
    // ... other parameters ...
) -> Result<impl Reply, Rejection> {
    let query_text = query.get("q").unwrap_or(&String::new());
    
    // Parse the query
    let parser = QueryParser::new();
    let parsed_query = parser.parse(query_text)
        .map_err(|e| warp::reject::custom(SearchError(e)))?;
    
    // Execute search
    let executor = SearchExecutor::new(index.clone());
    let results = executor.execute(parsed_query)
        .map_err(|e| warp::reject::custom(SearchError(e.to_string())))?;
    
    // Format response
    let response = json!({
        "query": {
            "original": query_text,
            "parsed": format!("{:?}", parsed_query),
        },
        "results": results.iter().map(|r| {
            json!({
                "document": r.doc,
                "score": r.score,
                "highlights": r.highlights,
            })
        }).collect::<Vec<_>>(),
        "metadata": {
            "total_hits": results.len(),
            "execution_time_ms": 0, // Add timing
        }
    });
    
    Ok(warp::reply::json(&response))
}

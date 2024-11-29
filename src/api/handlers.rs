// src/api/handlers.rs
use crate::prelude::*;

pub async fn handle_search(
    query: SearchQuery,
    engine: Arc<SearchEngine>,
) -> Result<impl Reply, Rejection> {
    let start = std::time::Instant::now();
    
    let results = engine.search(&query.q, Some(query.limit))
        .await
        .map_err(|e| ApiError::InternalError(e))?;

    let response = SearchResponse {
        query: query.q,
        total: results.len(),
        took_ms: start.elapsed().as_millis() as u64,
        results,
    };

    Ok(warp::reply::json(&response))
}

pub async fn handle_document_upload(
    request: DocumentUploadRequest,
    processor: Arc<DocumentProcessor>,
) -> Result<impl Reply, Rejection> {
    let upload = DocumentUpload::Text {
        content: request.content,
        title: request.title,
        metadata: request.metadata,
    };

    let id = processor.process_document(upload)
        .await
        .map_err(|e| ApiError::ProcessingError(e))?;

    Ok(warp::reply::json(&DocumentUploadResponse {
        id,
        status: "processing".to_string(),
        processing_id: id,
    }))
}

#[cfg(test)]
mod tests {
    use super::*;
    use warp::test::request;

    #[tokio::test]
    async fn test_search_handler() {
        // Mock dependencies
        let engine = Arc::new(SearchEngine::mock());
        
        // Create test query
        let query = SearchQuery {
            q: "test".to_string(),
            limit: 10,
            offset: 0,
            use_vector: false,
        };

        // Make request
        let response = handle_search(query, engine)
            .await
            .expect("Search should succeed");

        // Verify response
        assert!(response.status().is_success());
    }

    #[tokio::test]
    async fn test_upload_handler() {
        // TODO: Implement test
    }

    #[tokio::test]
    async fn test_status_handler() {
        // TODO: Implement test
    }
}
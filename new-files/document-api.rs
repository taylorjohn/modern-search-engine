// document_api.rs
use warp::{Filter, Reply, Rejection};
use serde_json::json;
use std::sync::Arc;
use tokio::sync::Mutex;
use futures::stream::StreamExt;

#[derive(Debug, Serialize)]
pub struct ProcessingStatus {
    id: String,
    status: String,
    progress: f32,
    message: Option<String>,
    result: Option<ProcessedDocument>,
}

pub struct ProcessingQueue {
    items: Arc<Mutex<Vec<ProcessingStatus>>>,
}

impl ProcessingQueue {
    pub fn new() -> Self {
        Self {
            items: Arc::new(Mutex::new(Vec::new())),
        }
    }
}

pub fn document_routes(
    processor: Arc<DocumentProcessor>,
    queue: Arc<ProcessingQueue>,
) -> impl Filter<Extract = impl Reply, Error = Rejection> + Clone {
    let upload = warp::path("documents")
        .and(warp::path("upload"))
        .and(warp::post())
        .and(warp::body::json())
        .and(with_processor(processor.clone()))
        .and(with_queue(queue.clone()))
        .and_then(handle_upload);

    let status = warp::path("documents")
        .and(warp::path("status"))
        .and(warp::path::param::<String>())
        .and(with_queue(queue.clone()))
        .and_then(handle_status);

    let process_url = warp::path("documents")
        .and(warp::path("process-url"))
        .and(warp::post())
        .and(warp::body::json())
        .and(with_processor(processor.clone()))
        .and(with_queue(queue.clone()))
        .and_then(handle_url_processing);

    upload.or(status).or(process_url)
}

async fn handle_upload(
    files: Vec<DocumentUpload>,
    processor: Arc<DocumentProcessor>,
    queue: Arc<ProcessingQueue>,
) -> Result<impl Reply, Rejection> {
    let processing_id = uuid::Uuid::new_v4().to_string();
    
    // Initialize status
    {
        let mut queue_items = queue.items.lock().await;
        queue_items.push(ProcessingStatus {
            id: processing_id.clone(),
            status: "started".to_string(),
            progress: 0.0,
            message: Some("Processing started".to_string()),
            result: None,
        });
    }

    // Spawn processing task
    tokio::spawn(async move {
        let total_files = files.len();
        let mut processed = Vec::new();
        
        for (index, file) in files.into_iter().enumerate() {
            let progress = (index as f32 / total_files as f32) * 100.0;
            
            // Update progress
            {
                let mut queue_items = queue.items.lock().await;
                if let Some(status) = queue_items.iter_mut().find(|s| s.id == processing_id) {
                    status.progress = progress;
                    status.message = Some(format!("Processing file {} of {}", index + 1, total_files));
                }
            }

            match processor.process_document(file).await {
                Ok(doc) => processed.push(doc),
                Err(e) => {
                    // Update status with error
                    let mut queue_items = queue.items.lock().await;
                    if let Some(status) = queue_items.iter_mut().find(|s| s.id == processing_id) {
                        status.status = "error".to_string();
                        status.message = Some(format!("Error processing file: {}", e));
                    }
                    return;
                }
            }
        }

        // Update final status
        let mut queue_items = queue.items.lock().await;
        if let Some(status) = queue_items.iter_mut().find(|s| s.id == processing_id) {
            status.status = "completed".to_string();
            status.progress = 100.0;
            status.message = Some(format!("Processed {} files", total_files));
            status.result = Some(processed[0].clone()); // For demonstration, showing first doc
        }
    });

    Ok(warp::reply::json(&json!({
        "processing_id": processing_id,
        "message": "Processing started",
    })))
}

async fn handle_status(
    processing_id: String,
    queue: Arc<ProcessingQueue>,
) -> Result<impl Reply, Rejection> {
    let queue_items = queue.items.lock().await;
    let status = queue_items
        .iter()
        .find(|s| s.id == processing_id)
        .cloned()
        .ok_or_else(|| warp::reject::not_found())?;

    Ok(warp::reply::json(&status))
}

async fn handle_url_processing(
    url: String,
    processor: Arc<DocumentProcessor>,
    queue: Arc<ProcessingQueue>,
) -> Result<impl Reply, Rejection> {
    let processing_id = uuid::Uuid::new_v4().to_string();

    // Initialize status
    {
        let mut queue_items = queue.items.lock().await;
        queue_items.push(ProcessingStatus {
            id: processing_id.clone(),
            status: "started".to_string(),
            progress: 0.0,
            message: Some("Fetching URL content".to_string()),
            result: None,
        });
    }

    // Spawn processing task
    tokio::spawn(async move {
        let client = reqwest::Client::new();
        
        // Update status to fetching
        {
            let mut queue_items = queue.items.lock().await;
            if let Some(status) = queue_items.iter_mut().find(|s| s.id == processing_id) {
                status.progress = 25.0;
                status.message = Some("Fetching content...".to_string());
            }
        }

        match client.get(&url).send().await {
            Ok(response) => {
                if let Ok(content) = response.text().await {
                    // Update status to processing
                    {
                        let mut queue_items = queue.items.lock().await;
                        if let Some(status) = queue_items.iter_mut().find(|s| s.id == processing_id) {
                            status.progress = 50.0;
                            status.message = Some("Processing content...".to_string());
                        }
                    }

                    // Process the document
                    let doc_upload = DocumentUpload::Html {
                        content,
                        url: Some(url),
                    };

                    match processor.process_document(doc_upload).await {
                        Ok(processed) => {
                            let mut queue_items = queue.items.lock().await;
                            if let Some(status) = queue_items.iter_mut().find(|s| s.id == processing_id) {
                                status.status = "completed".to_string();
                                status.progress = 100.0;
                                status.message = Some("Processing completed".to_string());
                                status.result = Some(processed);
                            }
                        }
                        Err(e) => {
                            let mut queue_items = queue.items.lock().await;
                            if let Some(status) = queue_items.iter_mut().find(|s| s.id == processing_id) {
                                status.status = "error".to_string();
                                status.message = Some(format!("Processing error: {}", e));
                            }
                        }
                    }
                }
            }
            Err(e) => {
                let mut queue_items = queue.items.lock().await;
                if let Some(status) = queue_items.iter_mut().find(|s| s.id == processing_id) {
                    status.status = "error".to_string();
                    status.message = Some(format!("Failed to fetch URL: {}", e));
                }
            }
        }
    });

    Ok(warp::reply::json(&json!({
        "processing_id": processing_id,
        "message": "URL processing started",
    })))
}

// Helper functions for warp filters
fn with_processor(
    processor: Arc<DocumentProcessor>,
) -> impl Filter<Extract = (Arc<DocumentProcessor>,), Error = std::convert::Infallible> + Clone {
    warp::any().map(move || processor.clone())
}

fn with_queue(
    queue: Arc<ProcessingQueue>,
) -> impl Filter<Extract = (Arc<ProcessingQueue>,), Error = std::convert::Infallible> + Clone {
    warp::any().map(move || queue.clone())
}

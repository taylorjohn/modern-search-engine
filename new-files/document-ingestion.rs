// document_ingestion.rs
use serde::{Deserialize, Serialize};
use tokio::sync::RwLock;
use std::sync::Arc;
use anyhow::Result;

#[derive(Debug, Deserialize)]
pub struct DocumentInput {
    pub title: String,
    pub content: String,
    pub author: String,
    pub tags: Vec<String>,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Serialize)]
pub struct IngestedDocument {
    pub id: String,
    pub title: String,
    pub content: String,
    pub author: String,
    pub tags: Vec<String>,
    pub vector: Vec<f32>,
    pub metadata: Option<serde_json::Value>,
    pub ingestion_time: chrono::DateTime<chrono::Utc>,
}

pub struct DocumentIngester {
    vector_store: Arc<RwLock<VectorStore>>,
    tantivy_index: Arc<tantivy::Index>,
    id_counter: Arc<RwLock<u64>>,
}

impl DocumentIngester {
    pub fn new(
        vector_store: Arc<RwLock<VectorStore>>,
        tantivy_index: Arc<tantivy::Index>,
    ) -> Self {
        Self {
            vector_store,
            tantivy_index,
            id_counter: Arc::new(RwLock::new(0)),
        }
    }

    pub async fn ingest_document(&self, input: DocumentInput) -> Result<IngestedDocument> {
        // Generate unique ID
        let id = {
            let mut counter = self.id_counter.write().await;
            *counter += 1;
            format!("doc_{}", counter)
        };

        // Generate vector embedding
        let vector_store = self.vector_store.read().await;
        let vector = vector_store.generate_embedding(&input.content).await?;

        // Create document
        let doc = IngestedDocument {
            id: id.clone(),
            title: input.title.clone(),
            content: input.content.clone(),
            author: input.author.clone(),
            tags: input.tags.clone(),
            vector,
            metadata: input.metadata.clone(),
            ingestion_time: chrono::Utc::now(),
        };

        // Add to vector store
        let mut vector_store = self.vector_store.write().await;
        vector_store.add_document(
            id.clone(),
            input.content.clone(),
            DocumentMetadata {
                title: input.title.clone(),
                content: input.content,
                author: input.author,
                tags: input.tags,
            },
        ).await?;

        // Add to Tantivy index
        let mut index_writer = self.tantivy_index.writer(50_000_000)?;
        let schema = self.tantivy_index.schema();
        
        let mut tantivy_doc = tantivy::Document::new();
        tantivy_doc.add_text(schema.get_field("id").unwrap(), &id);
        tantivy_doc.add_text(schema.get_field("title").unwrap(), &doc.title);
        tantivy_doc.add_text(schema.get_field("content").unwrap(), &doc.content);
        tantivy_doc.add_text(schema.get_field("author").unwrap(), &doc.author);
        tantivy_doc.add_text(schema.get_field("tags").unwrap(), &doc.tags.join(" "));

        index_writer.add_document(tantivy_doc)?;
        index_writer.commit()?;

        Ok(doc)
    }

    pub async fn bulk_ingest(&self, documents: Vec<DocumentInput>) -> Result<Vec<IngestedDocument>> {
        let mut results = Vec::new();
        
        for doc in documents {
            match self.ingest_document(doc).await {
                Ok(ingested) => results.push(ingested),
                Err(e) => eprintln!("Error ingesting document: {}", e),
            }
        }

        Ok(results)
    }
}

// document_handler.rs
use warp::{Filter, Reply, Rejection};
use std::sync::Arc;

pub fn document_routes(
    ingester: Arc<DocumentIngester>,
) -> impl Filter<Extract = impl Reply, Error = Rejection> + Clone {
    let add_document = warp::post()
        .and(warp::path("documents"))
        .and(warp::body::json())
        .and(with_ingester(ingester.clone()))
        .and_then(handle_add_document);

    let bulk_add = warp::post()
        .and(warp::path("documents"))
        .and(warp::path("bulk"))
        .and(warp::body::json())
        .and(with_ingester(ingester))
        .and_then(handle_bulk_add);

    add_document.or(bulk_add)
}

async fn handle_add_document(
    input: DocumentInput,
    ingester: Arc<DocumentIngester>,
) -> Result<impl Reply, Rejection> {
    match ingester.ingest_document(input).await {
        Ok(doc) => Ok(warp::reply::json(&doc)),
        Err(e) => Err(warp::reject::custom(ApiError(e.to_string()))),
    }
}

async fn handle_bulk_add(
    documents: Vec<DocumentInput>,
    ingester: Arc<DocumentIngester>,
) -> Result<impl Reply, Rejection> {
    match ingester.bulk_ingest(documents).await {
        Ok(docs) => Ok(warp::reply::json(&docs)),
        Err(e) => Err(warp::reject::custom(ApiError(e.to_string()))),
    }
}

fn with_ingester(
    ingester: Arc<DocumentIngester>,
) -> impl Filter<Extract = (Arc<DocumentIngester>,), Error = std::convert::Infallible> + Clone {
    warp::any().map(move || ingester.clone())
}

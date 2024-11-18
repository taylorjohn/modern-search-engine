// document_processor.rs
use crate::vector_search::{VectorStore, DocumentVector, DocumentMetadata};
use crate::search_executor::SearchExecutor;
use anyhow::Result;
use std::sync::Arc;
use tokio::sync::RwLock;

pub struct IntegratedProcessor {
    vector_store: Arc<RwLock<VectorStore>>,
    search_executor: Arc<SearchExecutor>,
    document_processor: DocumentProcessor,
}

impl IntegratedProcessor {
    pub fn new(
        vector_store: Arc<RwLock<VectorStore>>,
        search_executor: Arc<SearchExecutor>,
    ) -> Self {
        Self {
            vector_store,
            search_executor,
            document_processor: DocumentProcessor::new(),
        }
    }

    pub async fn process_and_index(&self, upload: DocumentUpload) -> Result<ProcessedDocument> {
        // First, process the document
        let processed = self.document_processor.process_document(upload).await?;

        // Create document metadata
        let metadata = DocumentMetadata {
            title: processed.title.clone(),
            content: processed.content.clone(),
            author: processed.metadata.author.clone().unwrap_or_default(),
            tags: vec![], // Add tags as needed
        };

        // Generate vector embedding
        let vector_store = self.vector_store.read().await;
        let embedding = vector_store.generate_embedding(&processed.content).await?;

        // Add to vector store
        let mut vector_store = self.vector_store.write().await;
        vector_store.add_document(
            processed.title.clone(),
            processed.content.clone(),
            metadata,
        ).await?;

        // Add to search index
        let schema = self.search_executor.get_schema();
        let mut index_writer = self.search_executor.get_index_writer()?;

        let mut doc = tantivy::Document::new();
        doc.add_text(schema.get_field("title").unwrap(), &processed.title);
        doc.add_text(schema.get_field("content").unwrap(), &processed.content);
        if let Some(author) = &processed.metadata.author {
            doc.add_text(schema.get_field("author").unwrap(), author);
        }

        index_writer.add_document(doc)?;
        index_writer.commit()?;

        Ok(processed)
    }
}

// Update main.rs to integrate everything
pub async fn setup_search_system() -> Result<(Arc<IntegratedProcessor>, Arc<SearchExecutor>)> {
    // Initialize vector store
    let vector_store = Arc::new(RwLock::new(VectorStore::new().await?));
    
    // Initialize search executor
    let index = create_search_index()?;
    let search_executor = Arc::new(SearchExecutor::new(index));
    
    // Initialize integrated processor
    let processor = Arc::new(IntegratedProcessor::new(
        vector_store.clone(),
        search_executor.clone(),
    ));

    Ok((processor, search_executor))
}

fn create_search_index() -> Result<tantivy::Index> {
    let mut schema_builder = tantivy::schema::Schema::builder();
    
    // Define fields
    schema_builder.add_text_field("title", tantivy::schema::TEXT | tantivy::schema::STORED);
    schema_builder.add_text_field("content", tantivy::schema::TEXT | tantivy::schema::STORED);
    schema_builder.add_text_field("author", tantivy::schema::TEXT | tantivy::schema::STORED);
    schema_builder.add_text_field("tags", tantivy::schema::TEXT | tantivy::schema::STORED);

    let schema = schema_builder.build();
    Ok(tantivy::Index::create_in_ram(schema))
}

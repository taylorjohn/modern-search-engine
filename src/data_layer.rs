use std::error::Error;
use std::sync::Arc;
use serde::{Serialize, Deserialize};
use parking_lot::RwLock;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Document {
    pub id: String,
    pub title: String,
    pub content: String,
    pub metadata: DocumentMetadata,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentMetadata {
    pub created_at: String,
    pub last_modified: String,
    pub author: String,
}

pub trait DataLayer: Send + Sync {
    fn add_document(&self, doc: Document) -> Result<(), Box<dyn Error>>;
    fn get_document(&self, id: &str) -> Result<Option<Document>, Box<dyn Error>>;
    fn search_documents(&self, query: &str) -> Result<Vec<Document>, Box<dyn Error>>;
}

pub struct InMemoryDataLayer {
    documents: Arc<RwLock<Vec<Document>>>,
}

impl InMemoryDataLayer {
    pub fn new() -> Self {
        Self {
            documents: Arc::new(RwLock::new(Vec::new())),
        }
    }
}

impl DataLayer for InMemoryDataLayer {
    fn add_document(&self, doc: Document) -> Result<(), Box<dyn Error>> {
        let mut documents = self.documents.write();
        documents.push(doc);
        Ok(())
    }

    fn get_document(&self, id: &str) -> Result<Option<Document>, Box<dyn Error>> {
        let documents = self.documents.read();
        Ok(documents.iter().find(|doc| doc.id == id).cloned())
    }

    fn search_documents(&self, query: &str) -> Result<Vec<Document>, Box<dyn Error>> {
        let documents = self.documents.read();
        let results: Vec<Document> = documents
            .iter()
            .filter(|doc| {
                doc.title.to_lowercase().contains(&query.to_lowercase()) ||
                doc.content.to_lowercase().contains(&query.to_lowercase())
            })
            .cloned()
            .collect();
        Ok(results)
    }
}
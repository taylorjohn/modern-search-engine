use std::sync::Arc;
use crate::data_layer::{DataLayer, Document};
use std::error::Error;

pub struct DataService<D: DataLayer> {
    data_layer: Arc<D>,
}

impl<D: DataLayer> DataService<D> {
    pub fn new(data_layer: Arc<D>) -> Self {
        Self { data_layer }
    }

    pub async fn add_document(&self, doc: Document) -> Result<(), Box<dyn Error>> {
        self.data_layer.add_document(doc)
    }

    pub async fn search(&self, query: &str) -> Result<Vec<Document>, Box<dyn Error>> {
        self.data_layer.search_documents(query)
    }

    pub async fn get_document(&self, id: &str) -> Result<Option<Document>, Box<dyn Error>> {
        self.data_layer.get_document(id)
    }
}
use crate::vector::store::VectorStore;
use crate::search::engine::SearchEngine;
use anyhow::{Result, Context};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;
use std::collections::HashMap;
use chrono::{DateTime, Utc};

#[derive(Debug, Deserialize)]
#[serde(tag = "type")]
pub enum DocumentUpload {
    #[serde(rename = "pdf")]
    Pdf {
        base64_content: String,
        filename: String,
        metadata: Option<HashMap<String, String>>,
    },
    #[serde(rename = "html")]
    Html {
        content: String,
        url: Option<String>,
        metadata: Option<HashMap<String, String>>,
    },
    #[serde(rename = "text")]
    Text {
        content: String,
        title: String,
        metadata: Option<HashMap<String, String>>,
    },
}

#[derive(Debug, Serialize, Clone)]
pub struct ProcessedDocument {
    pub id: String,
    pub title: String,
    pub content: String,
    pub content_type: String,
    pub word_count: usize,
    pub vector_embedding: Vec<f32>,
    pub metadata: DocumentMetadata,
    pub processing_info: ProcessingInfo,
}

#[derive(Debug, Serialize, Clone)]
pub struct DocumentMetadata {
    pub source_type: String,
    pub author: Option<String>,
    pub created_at: DateTime<Utc>,
    pub last_modified: DateTime<Utc>,
    pub language: Option<String>,
    pub tags: Vec<String>,
    pub custom_metadata: HashMap<String, String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct ProcessingInfo {
    pub processing_time_ms: u64,
    pub word_count: usize,
    pub language_detected: Option<String>,
    pub content_hash: String,
    pub vector_dimension: usize,
}

pub struct DocumentProcessor {
    vector_store: Arc<RwLock<VectorStore>>,
    search_engine: Arc<SearchEngine>,
    language_detector: whatlang::Detector,
}

impl DocumentProcessor {
    pub fn new(
        vector_store: Arc<RwLock<VectorStore>>,
        search_engine: Arc<SearchEngine>,
    ) -> Self {
        Self {
            vector_store,
            search_engine,
            language_detector: whatlang::Detector::new(),
        }
    }

    pub async fn process_document(&self, upload: DocumentUpload) -> Result<ProcessedDocument> {
        let start_time = std::time::Instant::now();

        // Process based on document type
        let (content, title, source_type, metadata) = match upload {
            DocumentUpload::Pdf { base64_content, filename, metadata } => {
                self.process_pdf(&base64_content, &filename, metadata).await?
            },
            DocumentUpload::Html { content, url, metadata } => {
                self.process_html(&content, url.as_deref(), metadata).await?
            },
            DocumentUpload::Text { content, title, metadata } => {
                self.process_text(&content, &title, metadata).await?
            },
        };

        // Generate vector embedding
        let vector_store = self.vector_store.read().await;
        let vector_embedding = vector_store.generate_embedding(&content).await?;

        // Detect language
        let language = self.detect_language(&content);

        // Calculate content hash
        let content_hash = calculate_hash(&content);

        // Create processed document
        let word_count = content.split_whitespace().count();
        
        let processed = ProcessedDocument {
            id: Uuid::new_v4().to_string(),
            title,
            content,
            content_type: source_type.clone(),
            word_count,
            vector_embedding,
            metadata: DocumentMetadata {
                source_type,
                author: metadata.get("author").cloned(),
                created_at: Utc::now(),
                last_modified: Utc::now(),
                language: language.clone(),
                tags: extract_tags(&metadata),
                custom_metadata: metadata,
            },
            processing_info: ProcessingInfo {
                processing_time_ms: start_time.elapsed().as_millis() as u64,
                word_count,
                language_detected: language,
                content_hash,
                vector_dimension: vector_embedding.len(),
            },
        };

        // Index the document
        self.index_document(&processed).await?;

        Ok(processed)
    }

    async fn process_pdf(
        &self,
        base64_content: &str,
        filename: &str,
        metadata: Option<HashMap<String, String>>,
    ) -> Result<(String, String, String, HashMap<String, String>)> {
        let pdf_bytes = base64::Engine::decode(&base64::engine::general_purpose::STANDARD, base64_content)
            .context("Failed to decode PDF content")?;

        let doc = lopdf::Document::load_mem(&pdf_bytes)
            .context("Failed to load PDF document")?;

        // Extract text content
        let mut content = String::new();
        for page_num in 1..=doc.get_pages().len() {
            if let Ok(page_text) = doc.extract_text(&[page_num]) {
                content.push_str(&page_text);
                content.push('\n');
            }
        }

        let title = doc.get_metadata().title
            .unwrap_or_else(|| filename_to_title(filename));

        let mut meta = metadata.unwrap_or_default();
        if let Some(author) = doc.get_metadata().author {
            meta.insert("author".to_string(), author);
        }

        Ok((content, title, "pdf".to_string(), meta))
    }

    async fn process_html(
        &self,
        content: &str,
        url: Option<&str>,
        metadata: Option<HashMap<String, String>>,
    ) -> Result<(String, String, String, HashMap<String, String>)> {
        let document = scraper::Html::parse_document(content);

        // Extract text content
        let text_selector = scraper::Selector::parse("body").unwrap();
        let mut text_content = String::new();
        
        if let Some(body) = document.select(&text_selector).next() {
            text_content = body.text().collect::<Vec<_>>().join(" ");
        }

        // Extract title
        let title_selector = scraper::Selector::parse("title").unwrap();
        let title = document.select(&title_selector)
            .next()
            .map(|el| el.text().collect::<String>())
            .unwrap_or_else(|| "Untitled Document".to_string());

        let mut meta = metadata.unwrap_or_default();
        if let Some(url) = url {
            meta.insert("url".to_string(), url.to_string());
        }

        Ok((text_content, title, "html".to_string(), meta))
    }

    async fn process_text(
        &self,
        content: &str,
        title: &str,
        metadata: Option<HashMap<String, String>>,
    ) -> Result<(String, String, String, HashMap<String, String>)> {
        Ok((
            content.to_string(),
            title.to_string(),
            "text".to_string(),
            metadata.unwrap_or_default(),
        ))
    }

    async fn index_document(&self, document: &ProcessedDocument) -> Result<()> {
        // Add to vector store
        let mut vector_store = self.vector_store.write().await;
        vector_store.add_document(
            document.id.clone(),
            &document.content,
            document.vector_embedding.clone(),
        ).await?;

        // Add to search index
        self.search_engine.index_document(document).await?;

        Ok(())
    }

    fn detect_language(&self, text: &str) -> Option<String> {
        self.language_detector.detect_lang(text)
            .map(|lang| lang.code().to_string())
    }

    pub async fn get_processing_status(&self, processing_id: &str) -> Result<ProcessingStatus> {
        // Implement status tracking
        todo!("Implement processing status tracking")
    }
}

#[derive(Debug, Serialize)]
pub struct ProcessingStatus {
    pub id: String,
    pub status: String,
    pub progress: f32,
    pub message: Option<String>,
    pub result: Option<ProcessedDocument>,
}

// Helper functions
fn calculate_hash(content: &str) -> String {
    use sha2::{Sha256, Digest};
    let mut hasher = Sha256::new();
    hasher.update(content.as_bytes());
    format!("{:x}", hasher.finalize())
}

// Continuing from previous code...

fn filename_to_title(filename: &str) -> String {
    filename
        .trim_end_matches(".pdf")
        .replace('_', " ")
        .replace('-', " ")
        .split_whitespace()
        .map(|word| {
            let mut chars = word.chars();
            match chars.next() {
                None => String::new(),
                Some(first) => first.to_uppercase().chain(chars).collect(),
            }
        })
        .collect::<Vec<_>>()
        .join(" ")
}

fn extract_tags(metadata: &HashMap<String, String>) -> Vec<String> {
    metadata.get("tags")
        .map(|tags| {
            tags.split(',')
                .map(|tag| tag.trim().to_string())
                .collect()
        })
        .unwrap_or_default()
}

// Add processing queue for status tracking
#[derive(Debug, Clone)]
pub struct ProcessingTask {
    pub id: String,
    pub status: ProcessingStatus,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl ProcessingTask {
    fn new(id: String) -> Self {
        let now = Utc::now();
        Self {
            id,
            status: ProcessingStatus {
                id: id.clone(),
                status: "pending".to_string(),
                progress: 0.0,
                message: None,
                result: None,
            },
            created_at: now,
            updated_at: now,
        }
    }

    fn update_progress(&mut self, progress: f32, message: Option<String>) {
        self.status.progress = progress;
        self.status.message = message;
        self.updated_at = Utc::now();
    }

    fn complete(&mut self, document: ProcessedDocument) {
        self.status.status = "completed".to_string();
        self.status.progress = 100.0;
        self.status.result = Some(document);
        self.updated_at = Utc::now();
    }

    fn fail(&mut self, error: String) {
        self.status.status = "failed".to_string();
        self.status.message = Some(error);
        self.updated_at = Utc::now();
    }
}

// Add to DocumentProcessor struct
pub struct DocumentProcessor {
    vector_store: Arc<RwLock<VectorStore>>,
    search_engine: Arc<SearchEngine>,
    language_detector: whatlang::Detector,
    processing_queue: Arc<RwLock<HashMap<String, ProcessingTask>>>,
}

impl DocumentProcessor {
    // Update new() function
    pub fn new(
        vector_store: Arc<RwLock<VectorStore>>,
        search_engine: Arc<SearchEngine>,
    ) -> Self {
        Self {
            vector_store,
            search_engine,
            language_detector: whatlang::Detector::new(),
            processing_queue: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    // Add async processing method
    pub async fn process_document_async(&self, upload: DocumentUpload) -> Result<String> {
        let processing_id = Uuid::new_v4().to_string();
        let task = ProcessingTask::new(processing_id.clone());
        
        // Add to queue
        {
            let mut queue = self.processing_queue.write().await;
            queue.insert(processing_id.clone(), task);
        }

        // Clone necessary components for async processing
        let processor = self.clone();
        let processing_id_clone = processing_id.clone();

        // Spawn processing task
        tokio::spawn(async move {
            let result = processor.process_document(upload).await;
            
            let mut queue = processor.processing_queue.write().await;
            if let Some(task) = queue.get_mut(&processing_id_clone) {
                match result {
                    Ok(doc) => task.complete(doc),
                    Err(e) => task.fail(e.to_string()),
                }
            }
        });

        Ok(processing_id)
    }

    // Update status check method
    pub async fn get_processing_status(&self, processing_id: &str) -> Result<ProcessingStatus> {
        let queue = self.processing_queue.read().await;
        queue.get(processing_id)
            .map(|task| task.status.clone())
            .ok_or_else(|| anyhow::anyhow!("Processing task not found"))
    }

    // Add cleanup method for completed tasks
    pub async fn cleanup_old_tasks(&self, max_age_hours: i64) -> Result<()> {
        let now = Utc::now();
        let mut queue = self.processing_queue.write().await;
        
        queue.retain(|_, task| {
            let age = now - task.updated_at;
            let hours = age.num_hours();
            
            // Keep task if it's still pending or younger than max age
            task.status.status == "pending" || hours < max_age_hours
        });

        Ok(())
    }

    // Add batch processing method
    pub async fn process_batch(
        &self,
        documents: Vec<DocumentUpload>,
        batch_id: Option<String>,
    ) -> Result<Vec<String>> {
        let batch_id = batch_id.unwrap_or_else(|| Uuid::new_v4().to_string());
        let mut processing_ids = Vec::new();

        for (index, doc) in documents.into_iter().enumerate() {
            let processing_id = format!("{}-{}", batch_id, index);
            let task = ProcessingTask::new(processing_id.clone());
            
            {
                let mut queue = self.processing_queue.write().await;
                queue.insert(processing_id.clone(), task);
            }

            processing_ids.push(processing_id.clone());

            // Process document asynchronously
            let processor = self.clone();
            let processing_id_clone = processing_id.clone();

            tokio::spawn(async move {
                let result = processor.process_document(doc).await;
                
                let mut queue = processor.processing_queue.write().await;
                if let Some(task) = queue.get_mut(&processing_id_clone) {
                    match result {
                        Ok(doc) => task.complete(doc),
                        Err(e) => task.fail(e.to_string()),
                    }
                }
            });
        }

        Ok(processing_ids)
    }

    // Add batch status check method
    pub async fn get_batch_status(&self, batch_id: &str) -> Result<BatchStatus> {
        let queue = self.processing_queue.read().await;
        let batch_tasks: Vec<_> = queue.values()
            .filter(|task| task.id.starts_with(batch_id))
            .collect();

        if batch_tasks.is_empty() {
            return Err(anyhow::anyhow!("Batch not found"));
        }

        let total = batch_tasks.len();
        let completed = batch_tasks.iter()
            .filter(|task| task.status.status == "completed")
            .count();
        let failed = batch_tasks.iter()
            .filter(|task| task.status.status == "failed")
            .count();
        let in_progress = total - completed - failed;

        Ok(BatchStatus {
            batch_id: batch_id.to_string(),
            total_documents: total,
            completed,
            failed,
            in_progress,
            overall_progress: (completed as f32 / total as f32) * 100.0,
            tasks: batch_tasks.into_iter().map(|t| t.status.clone()).collect(),
        })
    }
}

#[derive(Debug, Serialize)]
pub struct BatchStatus {
    pub batch_id: String,
    pub total_documents: usize,
    pub completed: usize,
    pub failed: usize,
    pub in_progress: usize,
    pub overall_progress: f32,
    pub tasks: Vec<ProcessingStatus>,
}

// Implement Clone for DocumentProcessor
impl Clone for DocumentProcessor {
    fn clone(&self) -> Self {
        Self {
            vector_store: self.vector_store.clone(),
            search_engine: self.search_engine.clone(),
            language_detector: whatlang::Detector::new(),
            processing_queue: self.processing_queue.clone(),
        }
    }
}
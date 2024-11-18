// document_processor.rs
use lopdf::Document as PdfDocument;
use scraper::{Html, Selector};
use anyhow::{Result, Context};
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};
use serde::{Deserialize, Serialize};
use std::io::Read;

#[derive(Debug, Deserialize)]
#[serde(tag = "type")]
pub enum DocumentUpload {
    #[serde(rename = "pdf")]
    Pdf {
        base64_content: String,
        filename: String,
    },
    #[serde(rename = "html")]
    Html {
        content: String,
        url: Option<String>,
    },
    #[serde(rename = "text")]
    Text {
        content: String,
        title: String,
    },
}

#[derive(Debug, Serialize)]
pub struct ProcessedDocument {
    pub title: String,
    pub content: String,
    pub metadata: DocumentMetadata,
    pub source_type: String,
}

#[derive(Debug, Serialize)]
pub struct DocumentMetadata {
    pub filename: Option<String>,
    pub url: Option<String>,
    pub page_count: Option<i32>,
    pub author: Option<String>,
    pub creation_date: Option<String>,
    pub word_count: i32,
    pub language: Option<String>,
}

pub struct DocumentProcessor {
    language_detector: whatlang::Detector,
}

impl DocumentProcessor {
    pub fn new() -> Self {
        Self {
            language_detector: whatlang::Detector::new(),
        }
    }

    pub async fn process_document(&self, upload: DocumentUpload) -> Result<ProcessedDocument> {
        match upload {
            DocumentUpload::Pdf { base64_content, filename } => {
                self.process_pdf(base64_content, filename).await
            },
            DocumentUpload::Html { content, url } => {
                self.process_html(content, url).await
            },
            DocumentUpload::Text { content, title } => {
                self.process_text(content, title).await
            },
        }
    }

    async fn process_pdf(&self, base64_content: String, filename: String) -> Result<ProcessedDocument> {
        // Decode base64 PDF content
        let pdf_bytes = BASE64.decode(base64_content)
            .context("Failed to decode base64 PDF content")?;

        // Parse PDF document
        let pdf = PdfDocument::load_mem(&pdf_bytes)
            .context("Failed to load PDF document")?;

        // Extract text content
        let mut content = String::new();
        for page_num in 1..=pdf.get_pages().len() {
            if let Ok(page_text) = pdf.extract_text(&[page_num]) {
                content.push_str(&page_text);
                content.push('\n');
            }
        }

        // Extract metadata
        let metadata = DocumentMetadata {
            filename: Some(filename),
            url: None,
            page_count: Some(pdf.get_pages().len() as i32),
            author: pdf.get_metadata().author,
            creation_date: pdf.get_metadata().creation_date,
            word_count: content.split_whitespace().count() as i32,
            language: self.detect_language(&content),
        };

        // Generate title from filename if no PDF title
        let title = pdf.get_metadata().title
            .unwrap_or_else(|| self.filename_to_title(&filename));

        Ok(ProcessedDocument {
            title,
            content,
            metadata,
            source_type: "pdf".to_string(),
        })
    }

    async fn process_html(&self, content: String, url: Option<String>) -> Result<ProcessedDocument> {
        // Parse HTML document
        let document = Html::parse_document(&content);

        // Extract text content
        let text_selector = Selector::parse("body").unwrap();
        let mut text_content = String::new();
        
        if let Some(body) = document.select(&text_selector).next() {
            text_content = body.text().collect::<Vec<_>>().join(" ");
        }

        // Extract title
        let title_selector = Selector::parse("title").unwrap();
        let title = document.select(&title_selector)
            .next()
            .map(|el| el.text().collect::<String>())
            .unwrap_or_else(|| "Untitled Document".to_string());

        // Extract metadata
        let metadata = DocumentMetadata {
            filename: None,
            url: url.clone(),
            page_count: None,
            author: self.extract_html_author(&document),
            creation_date: self.extract_html_date(&document),
            word_count: text_content.split_whitespace().count() as i32,
            language: self.detect_language(&text_content),
        };

        Ok(ProcessedDocument {
            title,
            content: text_content,
            metadata,
            source_type: "html".to_string(),
        })
    }

    async fn process_text(&self, content: String, title: String) -> Result<ProcessedDocument> {
        let metadata = DocumentMetadata {
            filename: None,
            url: None,
            page_count: None,
            author: None,
            creation_date: None,
            word_count: content.split_whitespace().count() as i32,
            language: self.detect_language(&content),
        };

        Ok(ProcessedDocument {
            title,
            content,
            metadata,
            source_type: "text".to_string(),
        })
    }

    fn detect_language(&self, text: &str) -> Option<String> {
        self.language_detector.detect_lang(text)
            .map(|lang| lang.code().to_string())
    }

    fn filename_to_title(&self, filename: &str) -> String {
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

    fn extract_html_author(&self, document: &Html) -> Option<String> {
        let author_selector = Selector::parse("meta[name='author']").unwrap();
        document.select(&author_selector)
            .next()
            .and_then(|el| el.value().attr("content"))
            .map(String::from)
    }

    fn extract_html_date(&self, document: &Html) -> Option<String> {
        let date_selector = Selector::parse("meta[name='date']").unwrap();
        document.select(&date_selector)
            .next()
            .and_then(|el| el.value().attr("content"))
            .map(String::from)
    }
}

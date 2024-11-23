// src/search/executor.rs
use std::sync::Arc;
use anyhow::{Result, Context};
use tantivy::{
    Document, Index, IndexReader, IndexWriter, 
    collector::TopDocs,
    query::{Query, QueryParser, BooleanQuery, Occur},
    schema::{Schema, STORED, TEXT, INDEXED},
    Score,
};
use crate::search::{
    types::SearchResult,
    query_parser::ParsedQuery,
};

pub struct SearchExecutor {
    index: Index,
    reader: IndexReader,
    writer: IndexWriter,
    schema: Schema,
}

impl SearchExecutor {
    pub fn new() -> Result<Self> {
        let mut schema_builder = Schema::builder();
        
        // Define schema
        let title = schema_builder.add_text_field("title", TEXT | STORED);
        let content = schema_builder.add_text_field("content", TEXT | STORED);
        let schema = schema_builder.build();

        // Create index
        let index = Index::create_in_ram(schema.clone());
        
        // Create reader and writer
        let reader = index.reader()?;
        let writer = index.writer(50_000_000)?; // 50MB buffer

        Ok(Self {
            index,
            reader,
            writer,
            schema,
        })
    }

    pub fn add_document(&mut self, title: &str, content: &str) -> Result<()> {
        let mut doc = Document::new();
        
        let title_field = self.schema.get_field("title").unwrap();
        let content_field = self.schema.get_field("content").unwrap();

        doc.add_text(title_field, title);
        doc.add_text(content_field, content);

        self.writer.add_document(doc)?;
        self.writer.commit()?;

        Ok(())
    }

    pub fn search(&self, query: ParsedQuery) -> Result<Vec<SearchResult>> {
        let searcher = self.reader.searcher();
        
        // Build query
        let query = self.build_query(query)?;
        
        // Search
        let top_docs = searcher.search(
            &query,
            &TopDocs::with_limit(10),
        )?;

        // Process results
        let mut results = Vec::new();
        for (_score, doc_address) in top_docs {
            let retrieved_doc = searcher.doc(doc_address)?;
            
            let title_field = self.schema.get_field("title").unwrap();
            let content_field = self.schema.get_field("content").unwrap();

            let title = retrieved_doc
                .get_first(title_field)
                .and_then(|v| v.as_text())
                .unwrap_or("Untitled")
                .to_string();

            let content = retrieved_doc
                .get_first(content_field)
                .and_then(|v| v.as_text())
                .unwrap_or("")
                .to_string();

            results.push(SearchResult {
                id: doc_address.to_string(),
                title,
                content,
                score: _score,
            });
        }

        Ok(results)
    }

    fn build_query(&self, parsed_query: ParsedQuery) -> Result<Box<dyn Query>> {
        let mut query_builder = BooleanQuery::new();
        let query_parser = QueryParser::for_index(&self.index, vec![
            self.schema.get_field("title").unwrap(),
            self.schema.get_field("content").unwrap(),
        ]);

        // Add terms
        for term in parsed_query.terms {
            let term_query = query_parser.parse_query(&term)
                .context("Failed to parse term query")?;
            query_builder.add(term_query, Occur::Must);
        }

        // Add phrases
        for phrase in parsed_query.phrases {
            let phrase_query = query_parser.parse_query(&format!("\"{}\"", phrase))
                .context("Failed to parse phrase query")?;
            query_builder.add(phrase_query, Occur::Must);
        }

        Ok(Box::new(query_builder))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_search() -> Result<()> {
        let mut executor = SearchExecutor::new()?;

        // Add test documents
        executor.add_document(
            "Test Document 1",
            "This is a test document about searching",
        )?;
        executor.add_document(
            "Test Document 2",
            "Another test document about indexing",
        )?;

        // Search
        let query = ParsedQuery {
            terms: vec!["test".to_string()],
            phrases: vec![],
        };

        let results = executor.search(query)?;
        assert_eq!(results.len(), 2);
        assert!(results[0].content.contains("test"));

        Ok(())
    }
}
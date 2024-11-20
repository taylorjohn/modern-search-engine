// search_executor.rs
use tantivy::{Index, Document, Score};
use crate::query_parser::{ParsedQuery, QueryToken};

pub struct SearchExecutor {
    index: Index,
}

#[derive(Debug)]
pub struct SearchResult {
    pub doc: Document,
    pub score: Score,
    pub highlights: Vec<String>,
}

impl SearchExecutor {
    pub fn new(index: Index) -> Self {
        Self { index }
    }

    pub fn execute(&self, parsed_query: ParsedQuery) -> Result<Vec<SearchResult>, Box<dyn std::error::Error>> {
        let reader = self.index.reader()?;
        let searcher = reader.searcher();
        
        // Convert parsed query to Tantivy query
        let query = self.build_tantivy_query(&parsed_query)?;
        
        // Execute search
        let top_docs = searcher.search(&query, &tantivy::collector::TopDocs::with_limit(10))?;
        
        // Process results
        let mut results = Vec::new();
        for (_score, doc_address) in top_docs {
            let doc = searcher.doc(doc_address)?;
            let highlights = self.generate_highlights(&doc, &parsed_query);
            
            results.push(SearchResult {
                doc,
                score: _score,
                highlights,
            });
        }
        
        Ok(results)
    }

    fn build_tantivy_query(&self, parsed_query: &ParsedQuery) 
        -> Result<Box<dyn tantivy::query::Query>, Box<dyn std::error::Error>> {
        let mut query_builder = tantivy::query::BooleanQuery::new();
        
        for token in &parsed_query.tokens {
            match token {
                QueryToken::Term(term) => {
                    let term_query = self.create_term_query(term);
                    query_builder.add(term_query, tantivy::schema::Occur::Must);
                }
                QueryToken::Phrase(phrase) => {
                    let phrase_query = self.create_phrase_query(phrase);
                    query_builder.add(phrase_query, tantivy::schema::Occur::Must);
                }
                QueryToken::Wildcard(pattern) => {
                    let wildcard_query = self.create_wildcard_query(pattern);
                    query_builder.add(wildcard_query, tantivy::schema::Occur::Must);
                }
                QueryToken::Fuzzy(term, distance) => {
                    let fuzzy_query = self.create_fuzzy_query(term, *distance);
                    query_builder.add(fuzzy_query, tantivy::schema::Occur::Must);
                }
                QueryToken::FieldQuery(field, query) => {
                    let field_query = self.create_field_query(field, query);
                    query_builder.add(field_query, tantivy::schema::Occur::Must);
                }
                // Handle other query tokens...
                _ => {}
            }
        }
        
        Ok(Box::new(query_builder))
    }

    fn generate_highlights(&self, doc: &Document, parsed_query: &ParsedQuery) -> Vec<String> {
        // Implement highlight generation based on query matches
        Vec::new() // Placeholder
    }

    // Helper methods for creating specific query types
    fn create_term_query(&self, term: &str) -> Box<dyn tantivy::query::Query> {
        // Implement term query creation
        Box::new(tantivy::query::TermQuery::new(
            tantivy::Term::from_field_text(
                self.index.schema().get_field("content").unwrap(),
                term
            ),
            tantivy::schema::IndexRecordOption::Basic
        ))
    }

    fn create_phrase_query(&self, phrase: &str) -> Box<dyn tantivy::query::Query> {
        // Implement phrase query creation
        Box::new(tantivy::query::PhraseQuery::new(
            phrase.split_whitespace()
                .map(|term| tantivy::Term::from_field_text(
                    self.index.schema().get_field("content").unwrap(),
                    term
                ))
                .collect()
        ))
    }

    fn create_wildcard_query(&self, pattern: &str) -> Box<dyn tantivy::query::Query> {
        // Implement wildcard query creation
        Box::new(tantivy::query::RegexQuery::new(
            self.index.schema().get_field("content").unwrap(),
            pattern.replace("*", ".*")
        ))
    }

    fn create_fuzzy_query(&self, term: &str, distance: u32) -> Box<dyn tantivy::query::Query> {
        // Implement fuzzy query creation
        Box::new(tantivy::query::FuzzyTermQuery::new(
            tantivy::Term::from_field_text(
                self.index.schema().get_field("content").unwrap(),
                term
            ),
            distance as u8,
            true
        ))
    }

    fn create_field_query(&self, field: &str, query: &QueryToken) -> Box<dyn tantivy::query::Query> {
        // Implement field-specific query creation
        self.create_term_query(&field) // Placeholder
    }
}

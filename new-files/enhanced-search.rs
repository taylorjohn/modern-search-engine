// query_parser.rs
use std::str::FromStr;

#[derive(Debug, PartialEq)]
pub enum QueryToken {
    Term(String),
    Phrase(String),
    And,
    Or,
    Not,
    Wildcard(String),
    Fuzzy(String, u32),
    FieldQuery(String, Box<QueryToken>),
}

#[derive(Debug)]
pub struct ParsedQuery {
    pub tokens: Vec<QueryToken>,
    pub fields: Vec<String>,
}

pub struct QueryParser {
    default_fuzzy_distance: u32,
}

impl QueryParser {
    pub fn new() -> Self {
        Self {
            default_fuzzy_distance: 2,
        }
    }

    pub fn parse(&self, query: &str) -> Result<ParsedQuery, String> {
        let mut tokens = Vec::new();
        let mut fields = Vec::new();
        let mut chars = query.chars().peekable();

        while let Some(&c) = chars.peek() {
            match c {
                '"' => {
                    chars.next(); // consume opening quote
                    let phrase = self.parse_phrase(&mut chars)?;
                    tokens.push(QueryToken::Phrase(phrase));
                }
                '+' => {
                    chars.next();
                    tokens.push(QueryToken::And);
                }
                '|' => {
                    chars.next();
                    tokens.push(QueryToken::Or);
                }
                '-' => {
                    chars.next();
                    tokens.push(QueryToken::Not);
                }
                ':' => {
                    chars.next();
                    if let Some(last_token) = tokens.last() {
                        if let QueryToken::Term(field) = last_token {
                            fields.push(field.clone());
                            tokens.pop(); // Remove the field term
                            let next_token = self.parse_token(&mut chars)?;
                            tokens.push(QueryToken::FieldQuery(field.clone(), Box::new(next_token)));
                        }
                    }
                }
                ' ' | '\t' | '\n' => {
                    chars.next(); // skip whitespace
                }
                _ => {
                    let term = self.parse_term(&mut chars)?;
                    tokens.push(self.classify_term(&term));
                }
            }
        }

        Ok(ParsedQuery { tokens, fields })
    }

    fn parse_phrase(&self, chars: &mut std::iter::Peekable<std::str::Chars>) -> Result<String, String> {
        let mut phrase = String::new();
        
        while let Some(&c) = chars.peek() {
            match c {
                '"' => {
                    chars.next(); // consume closing quote
                    return Ok(phrase);
                }
                _ => {
                    chars.next();
                    phrase.push(c);
                }
            }
        }
        
        Err("Unclosed phrase".to_string())
    }

    fn parse_term(&self, chars: &mut std::iter::Peekable<std::str::Chars>) -> Result<String, String> {
        let mut term = String::new();
        
        while let Some(&c) = chars.peek() {
            match c {
                ' ' | '\t' | '\n' | '"' | '+' | '|' | '-' | ':' => break,
                _ => {
                    chars.next();
                    term.push(c);
                }
            }
        }
        
        Ok(term)
    }

    fn classify_term(&self, term: &str) -> QueryToken {
        if term.contains('*') {
            QueryToken::Wildcard(term.to_string())
        } else if term.contains('~') {
            let parts: Vec<&str> = term.split('~').collect();
            let distance = parts.get(1)
                .and_then(|d| u32::from_str(d).ok())
                .unwrap_or(self.default_fuzzy_distance);
            QueryToken::Fuzzy(parts[0].to_string(), distance)
        } else {
            QueryToken::Term(term.to_string())
        }
    }
}

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

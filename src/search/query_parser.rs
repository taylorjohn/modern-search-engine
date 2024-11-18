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

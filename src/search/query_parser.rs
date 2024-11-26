// src/search/query_parser.rs
use anyhow::Result;

#[derive(Debug, Clone)]
pub struct ParsedQuery {
    pub terms: Vec<String>,
    pub phrases: Vec<String>,
}

pub struct QueryParser;

impl QueryParser {
    pub fn parse(query: &str) -> Result<ParsedQuery> {
        let mut terms = Vec::new();
        let mut phrases = Vec::new();
        let mut current_phrase = String::new();
        let mut in_phrase = false;

        for token in query.split_whitespace() {
            if token.starts_with('"') {
                in_phrase = true;
                current_phrase = token[1..].to_string();
            } else if token.ends_with('"') {
                in_phrase = false;
                current_phrase.push_str(" ");
                current_phrase.push_str(&token[..token.len()-1]);
                phrases.push(current_phrase.clone());
                current_phrase.clear();
            } else if in_phrase {
                current_phrase.push_str(" ");
                current_phrase.push_str(token);
            } else {
                terms.push(token.to_string());
            }
        }

        // Handle unclosed quotes
        if in_phrase {
            terms.extend(current_phrase.split_whitespace().map(String::from));
        }

        Ok(ParsedQuery { terms, phrases })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_query_parsing() {
        let query = r#"test "this phrase" another "quoted phrase" word"#;
        let parsed = QueryParser::parse(query).unwrap();

        assert_eq!(parsed.terms, vec!["test", "another", "word"]);
        assert_eq!(parsed.phrases, vec!["this phrase", "quoted phrase"]);
    }

    #[test]
    fn test_unclosed_quote() {
        let query = r#"test "unclosed phrase"#;
        let parsed = QueryParser::parse(query).unwrap();

        assert_eq!(parsed.terms, vec!["test", "unclosed", "phrase"]);
        assert!(parsed.phrases.is_empty());
    }
}
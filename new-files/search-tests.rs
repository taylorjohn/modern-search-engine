// tests/search_tests.rs
use crate::{
    query_parser::{QueryParser, QueryToken, ParsedQuery},
    search_executor::SearchExecutor,
};
use tantivy::{doc, Index, Term};
use std::sync::Arc;

// Test data structure
struct TestDocument {
    id: String,
    title: String,
    content: String,
    author: String,
    tags: Vec<String>,
}

// Helper function to create test index
fn create_test_index() -> Index {
    let mut schema_builder = tantivy::schema::Schema::builder();
    
    // Define fields
    let id_field = schema_builder.add_text_field("id", tantivy::schema::TEXT | tantivy::schema::STORED);
    let title_field = schema_builder.add_text_field("title", tantivy::schema::TEXT | tantivy::schema::STORED);
    let content_field = schema_builder.add_text_field("content", tantivy::schema::TEXT | tantivy::schema::STORED);
    let author_field = schema_builder.add_text_field("author", tantivy::schema::TEXT | tantivy::schema::STORED);
    let tags_field = schema_builder.add_text_field("tags", tantivy::schema::TEXT | tantivy::schema::STORED);

    let schema = schema_builder.build();
    let index = Index::create_in_ram(schema);

    // Create test documents
    let test_docs = vec![
        TestDocument {
            id: "1".to_string(),
            title: "Introduction to Rust Programming".to_string(),
            content: "Rust is a systems programming language that runs blazingly fast".to_string(),
            author: "John Doe".to_string(),
            tags: vec!["programming".to_string(), "rust".to_string()],
        },
        TestDocument {
            id: "2".to_string(),
            title: "Advanced Rust Techniques".to_string(),
            content: "Learn about advanced rust programming concepts and patterns".to_string(),
            author: "Jane Smith".to_string(),
            tags: vec!["advanced".to_string(), "rust".to_string()],
        },
        TestDocument {
            id: "3".to_string(),
            title: "Python vs Rust Comparison".to_string(),
            content: "Comparing Python and Rust performance and features".to_string(),
            author: "John Doe".to_string(),
            tags: vec!["comparison".to_string(), "rust".to_string(), "python".to_string()],
        },
    ];

    // Index test documents
    let mut index_writer = index.writer(50_000_000).unwrap();
    for doc in test_docs {
        index_writer.add_document(doc!(
            id_field => doc.id,
            title_field => doc.title,
            content_field => doc.content,
            author_field => doc.author,
            tags_field => doc.tags.join(" ")
        )).unwrap();
    }
    index_writer.commit().unwrap();

    index
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_query_parser() {
        let parser = QueryParser::new();
        
        // Test exact phrase matching
        let result = parser.parse("\"rust programming\"").unwrap();
        assert_eq!(
            result.tokens[0],
            QueryToken::Phrase("rust programming".to_string())
        );

        // Test field-specific search
        let result = parser.parse("author:\"John Doe\"").unwrap();
        assert!(matches!(
            result.tokens[0],
            QueryToken::FieldQuery(_, _)
        ));

        // Test boolean operators
        let result = parser.parse("+rust -python").unwrap();
        assert_eq!(result.tokens[0], QueryToken::And);
        assert_eq!(result.tokens[2], QueryToken::Not);

        // Test wildcard search
        let result = parser.parse("rust*").unwrap();
        assert!(matches!(
            result.tokens[0],
            QueryToken::Wildcard(_)
        ));

        // Test fuzzy search
        let result = parser.parse("programming~2").unwrap();
        assert!(matches!(
            result.tokens[0],
            QueryToken::Fuzzy(_, 2)
        ));
    }

    #[test]
    fn test_exact_phrase_search() {
        let index = create_test_index();
        let executor = SearchExecutor::new(index);
        let parser = QueryParser::new();

        let query = parser.parse("\"rust programming\"").unwrap();
        let results = executor.execute(query).unwrap();

        assert!(!results.is_empty());
        assert!(results[0].doc.get_first("content").unwrap().text().unwrap()
            .contains("rust programming"));
    }

    #[test]
    fn test_field_specific_search() {
        let index = create_test_index();
        let executor = SearchExecutor::new(index);
        let parser = QueryParser::new();

        let query = parser.parse("author:\"John Doe\"").unwrap();
        let results = executor.execute(query).unwrap();

        assert_eq!(results.len(), 2);
        for result in results {
            assert_eq!(
                result.doc.get_first("author").unwrap().text().unwrap(),
                "John Doe"
            );
        }
    }

    #[test]
    fn test_boolean_operators() {
        let index = create_test_index();
        let executor = SearchExecutor::new(index);
        let parser = QueryParser::new();

        let query = parser.parse("+rust -python").unwrap();
        let results = executor.execute(query).unwrap();

        for result in results {
            let content = result.doc.get_first("content").unwrap().text().unwrap();
            assert!(content.to_lowercase().contains("rust"));
            assert!(!content.to_lowercase().contains("python"));
        }
    }

    #[test]
    fn test_wildcard_search() {
        let index = create_test_index();
        let executor = SearchExecutor::new(index);
        let parser = QueryParser::new();

        let query = parser.parse("pro*").unwrap();
        let results = executor.execute(query).unwrap();

        assert!(!results.is_empty());
        for result in results {
            let content = result.doc.get_first("content").unwrap().text().unwrap();
            assert!(content.to_lowercase().contains("programming"));
        }
    }

    #[test]
    fn test_fuzzy_search() {
        let index = create_test_index();
        let executor = SearchExecutor::new(index);
        let parser = QueryParser::new();

        let query = parser.parse("programmming~2").unwrap(); // Intentional typo
        let results = executor.execute(query).unwrap();

        assert!(!results.is_empty());
        for result in results {
            let content = result.doc.get_first("content").unwrap().text().unwrap();
            assert!(content.to_lowercase().contains("programming"));
        }
    }

    #[test]
    fn test_combined_search() {
        let index = create_test_index();
        let executor = SearchExecutor::new(index);
        let parser = QueryParser::new();

        let query = parser.parse("author:\"John Doe\" +\"rust programming\"").unwrap();
        let results = executor.execute(query).unwrap();

        assert!(!results.is_empty());
        for result in results {
            let author = result.doc.get_first("author").unwrap().text().unwrap();
            let content = result.doc.get_first("content").unwrap().text().unwrap();
            assert_eq!(author, "John Doe");
            assert!(content.to_lowercase().contains("rust"));
        }
    }

    #[test]
    fn test_relevance_scoring() {
        let index = create_test_index();
        let executor = SearchExecutor::new(index);
        let parser = QueryParser::new();

        let query = parser.parse("rust programming").unwrap();
        let results = executor.execute(query).unwrap();

        if results.len() >= 2 {
            assert!(results[0].score >= results[1].score);
        }
    }
}

// Integration tests
#[cfg(test)]
mod integration_tests {
    use super::*;
    use warp::http::StatusCode;

    #[tokio::test]
    async fn test_search_endpoint() {
        let index = Arc::new(create_test_index());
        
        // Create test server
        let search = warp::path("search")
            .and(warp::query::<std::collections::HashMap<String, String>>())
            .and(with_index(index.clone()))
            .and_then(handle_search);

        // Test exact phrase search
        let response = warp::test::request()
            .path("/search?q=%22rust%20programming%22")
            .reply(&search)
            .await;

        assert_eq!(response.status(), StatusCode::OK);
        let body: serde_json::Value = serde_json::from_slice(response.body()).unwrap();
        assert!(!body["results"].as_array().unwrap().is_empty());

        // Test field-specific search
        let response = warp::test::request()
            .path("/search?q=author%3A%22John%20Doe%22")
            .reply(&search)
            .await;

        assert_eq!(response.status(), StatusCode::OK);
        let body: serde_json::Value = serde_json::from_slice(response.body()).unwrap();
        assert_eq!(body["results"].as_array().unwrap().len(), 2);
    }
}

// Helper function for integration tests
fn with_index(
    index: Arc<Index>,
) -> impl Filter<Extract = (Arc<Index>,), Error = std::convert::Infallible> + Clone {
    warp::any().map(move || index.clone())
}

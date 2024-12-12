#[cfg(test)]
mod tests {
    use crate::query_expander::QueryExpander;
    use crate::spell_checker::SpellChecker;
    use crate::trie::Trie;
    use crate::semantic_analysis::SemanticAnalyzer;
    use crate::data_layer::{Document, DocumentMetadata, InMemoryDataLayer};

    #[test]
    fn test_query_expansion() {
        let expander = QueryExpander::new();
        let result = expander.expand("test query");
        assert_eq!(result, "test query");
    }

    #[test]
    fn test_spell_checker() {
        let checker = SpellChecker::new();
        let result = checker.correct("test");
        assert_eq!(result, "test");
    }

    #[test]
    fn test_trie() {
        let mut trie = Trie::new();
        trie.insert("hello");
        trie.insert("help");
        trie.insert("world");
        
        let results = trie.search("hel");
        assert!(results.contains(&"hello".to_string()));
        assert!(results.contains(&"help".to_string()));
        assert_eq!(results.len(), 2);
    }

    #[test]
    fn test_data_layer() {
        let data_layer = InMemoryDataLayer::new();
        
        let doc = Document {
            id: "1".to_string(),
            title: "Test Document".to_string(),
            content: "This is a test document.".to_string(),
            metadata: DocumentMetadata {
                created_at: "2024-01-01".to_string(),
                last_modified: "2024-01-01".to_string(),
                author: "Test Author".to_string(),
            },
        };

        assert!(data_layer.add_document(doc.clone()).is_ok());
        
        let retrieved = data_layer.get_document("1").unwrap();
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().title, "Test Document");
        
        let search_results = data_layer.search_documents("test").unwrap();
        assert_eq!(search_results.len(), 1);
    }
}
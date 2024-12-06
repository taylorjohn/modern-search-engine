use std::sync::Arc;
use tokio::sync::Mutex;
use std::time::Instant;
use warp::reply::Json;
use tantivy::{Index, schema::Schema, collector::TopDocs, query::QueryParser};
use crate::query_expander::QueryExpander;
use crate::spell_checker::SpellChecker;
use crate::trie::Trie;
use crate::semantic_analysis::SemanticAnalyzer;
use crate::search_result::{SearchResult, ProcessingStep, DocumentResult};

pub async fn handle_search(
    query: std::collections::HashMap<String, String>,
    index: Arc<Index>,
    schema: Arc<Schema>,
    query_expander: Arc<QueryExpander>,
    spell_checker: Arc<SpellChecker>,
    trie: Arc<Trie>,
    semantic_analyzer: Arc<Mutex<SemanticAnalyzer>>,
) -> Result<Json, warp::Rejection> {
    let mut processing_steps = Vec::new();
    let query_text = query.get("q").unwrap_or(&String::new()).to_string();
    
    let start = Instant::now();
    let expanded_query = query_expander.expand(&query_text);
    processing_steps.push(ProcessingStep {
        step_name: "Query Expansion".to_string(),
        description: format!("Expanded '{}' to '{}'", query_text, expanded_query),
        time_taken_ms: start.elapsed().as_secs_f64() * 1000.0,
    });

    let start = Instant::now();
    let corrected_query = spell_checker.correct(&expanded_query);
    processing_steps.push(ProcessingStep {
        step_name: "Spell Checking".to_string(),
        description: format!("Corrected '{}' to '{}'", expanded_query, corrected_query),
        time_taken_ms: start.elapsed().as_secs_f64() * 1000.0,
    });

    // Perform actual search using tantivy
    let start = Instant::now();
    let searcher = index.reader()
        .expect("Failed to create reader")
        .searcher();

    let title_field = schema.get_field("title").expect("Failed to get title field");
    let body_field = schema.get_field("body").expect("Failed to get body field");
    
    let query_parser = QueryParser::for_index(&index, vec![title_field, body_field]);
    let query = query_parser.parse_query(&corrected_query)
        .expect("Failed to parse query");

    let top_docs = searcher.search(&query, &TopDocs::with_limit(5))
        .expect("Search failed");

    let mut final_results = Vec::new();
    for (_score, doc_address) in top_docs {
        let retrieved_doc = searcher.doc(doc_address).expect("Failed to retrieve doc");
        let title = retrieved_doc.get_first(title_field)
            .and_then(|v| v.as_text())
            .unwrap_or("Untitled");
        let snippet = retrieved_doc.get_first(body_field)
            .and_then(|v| v.as_text())
            .unwrap_or("No content");
        
        let semantic_score = semantic_analyzer.lock().await.analyze(snippet);
        let term_match_score = _score as f32;
        let final_score = (semantic_score + term_match_score) / 2.0;

        final_results.push(DocumentResult {
            title: title.to_string(),
            snippet: snippet.to_string(),
            semantic_similarity: semantic_score,
            term_match_score,
            final_score,
        });
    }

    processing_steps.push(ProcessingStep {
        step_name: "Search Execution".to_string(),
        description: format!("Found {} results", final_results.len()),
        time_taken_ms: start.elapsed().as_secs_f64() * 1000.0,
    });

    let search_result = SearchResult {
        original_query: query_text,
        expanded_query,
        spell_corrected_query: corrected_query,
        semantic_score: 0.0, // Updated based on results
        trie_matches: vec![],
        final_results,
        processing_steps,
    };

    Ok(warp::reply::json(&search_result))
}
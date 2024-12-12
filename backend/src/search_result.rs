use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct SearchResult {
    pub original_query: String,
    pub expanded_query: String,
    pub spell_corrected_query: String,
    pub semantic_score: f32,
    pub trie_matches: Vec<String>,
    pub final_results: Vec<DocumentResult>,
    pub processing_steps: Vec<ProcessingStep>
}

#[derive(Debug, Serialize)]
pub struct DocumentResult {
    pub title: String,
    pub snippet: String,
    pub semantic_similarity: f32,
    pub term_match_score: f32,
    pub final_score: f32,
}

#[derive(Debug, Serialize)]
pub struct ProcessingStep {
    pub step_name: String,
    pub description: String,
    pub time_taken_ms: f64,
}
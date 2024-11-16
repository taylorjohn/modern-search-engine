use tantivy::Document;
use tantivy::schema::Field;

pub struct ScoreCalculator;

impl ScoreCalculator {
    pub fn calculate_score(
        semantic_score: f32,
        term_match_score: f32,
    ) -> f32 {
        (semantic_score * 0.6) + (term_match_score * 0.4)
    }

    pub fn calculate_term_match_score(
        _doc: &Document,
        _query_terms: &[String],
        _title_field: Field,
        _body_field: Field,
    ) -> f32 {
        0.8
    }

    pub fn calculate_semantic_similarity(
        _doc_text: &str,
        _query_text: &str,
    ) -> f32 {
        0.7
    }
}
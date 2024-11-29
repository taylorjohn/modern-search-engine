pub struct ScoreCalculator;

impl ScoreCalculator {
    pub fn combine_scores(text_score: f32, vector_score: f32, config: &crate::search::SearchConfig) -> f32 {
        text_score * config.text_weight + vector_score * config.vector_weight
    }

    pub fn normalize_score(score: f32) -> f32 {
        score.min(1.0).max(0.0)
    }
}

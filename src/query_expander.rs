#[derive(Clone)]
pub struct QueryExpander;

impl QueryExpander {
    pub fn new() -> Self {
        QueryExpander
    }

    pub fn expand(&self, query: &str) -> String {
        query.to_string()
    }
}
use std::collections::HashSet;

pub struct Suggestions {
    history: HashSet<String>,
}

impl Suggestions {
    pub fn new() -> Self {
        Self {
            history: HashSet::new(),
        }
    }

    pub fn add_to_history(&mut self, query: String) {
        self.history.insert(query);
    }

    pub fn get_suggestions(&self, prefix: &str) -> Vec<String> {
        self.history
            .iter()
            .filter(|q| q.starts_with(prefix))
            .take(5)
            .cloned()
            .collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_suggestions() {
        let mut suggestions = Suggestions::new();
        suggestions.add_to_history("test query".to_string());
        suggestions.add_to_history("test another".to_string());
        suggestions.add_to_history("something else".to_string());

        let results = suggestions.get_suggestions("test");
        assert_eq!(results.len(), 2);
        assert!(results.contains(&"test query".to_string()));
        assert!(results.contains(&"test another".to_string()));
    }
}
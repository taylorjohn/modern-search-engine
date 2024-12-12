#[derive(Clone)]
pub struct SpellChecker;

impl SpellChecker {
    pub fn new() -> Self {
        SpellChecker
    }

    pub fn correct(&self, text: &str) -> String {
        text.to_string()
    }
}
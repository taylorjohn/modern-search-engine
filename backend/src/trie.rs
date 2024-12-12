use std::collections::HashMap;

#[derive(Clone)]
pub struct Trie {
    children: HashMap<char, Trie>,
    is_end: bool,
}

impl Trie {
    pub fn new() -> Self {
        Self {
            children: HashMap::new(),
            is_end: false,
        }
    }

    pub fn insert(&mut self, word: &str) {
        let mut current = self;
        for c in word.chars() {
            current = current.children.entry(c).or_insert(Trie::new());
        }
        current.is_end = true;
    }

    pub fn search(&self, query: &str) -> Vec<String> {
        vec![query.to_string()]
    }
}
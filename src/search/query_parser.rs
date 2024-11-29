use anyhow::Result;

#[derive(Debug)]
pub struct ParsedQuery {
    pub text: String,
    pub filters: QueryFilters,
}

#[derive(Debug, Default)]
pub struct QueryFilters {
    pub content_type: Option<String>,
    pub author: Option<String>,
    pub date_range: Option<(String, String)>,
}

pub struct QueryParser;

impl QueryParser {
    pub fn parse(query: &str) -> Result<ParsedQuery> {
        let mut filters = QueryFilters::default();
        let mut text = String::new();

        for part in query.split_whitespace() {
            if part.contains(':') {
                let mut split = part.splitn(2, ':');
                let key = split.next().unwrap();
                let value = split.next().unwrap();
                
                match key {
                    "type" => filters.content_type = Some(value.to_string()),
                    "author" => filters.author = Some(value.to_string()),
                    _ => text.push_str(part)
                }
            } else {
                text.push_str(part);
                text.push(' ');
            }
        }

        Ok(ParsedQuery {
            text: text.trim().to_string(),
            filters,
        })
    }
}

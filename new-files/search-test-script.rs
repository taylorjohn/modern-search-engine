// tests/search_demo.rs
use colored::*;
use std::time::Instant;

async fn run_search_demo() {
    println!("\n{}", "=== Search Engine Capabilities Demo ===".blue().bold());

    let index = create_test_index();
    let executor = SearchExecutor::new(index);
    let parser = QueryParser::new();

    // Test cases
    let test_cases = vec![
        ("Exact Phrase", "\"rust programming\""),
        ("Field Search", "author:\"John Doe\""),
        ("Boolean AND", "+rust +programming"),
        ("Boolean NOT", "rust -python"),
        ("Wildcard", "pro*"),
        ("Fuzzy Search", "programmming~2"),
        ("Combined Search", "author:\"John Doe\" +\"rust programming\""),
    ];

    for (test_name, query) in test_cases {
        println!("\n{} {}", "Testing:".yellow(), test_name);
        println!("{} {}", "Query:".cyan(), query);
        
        let start = Instant::now();
        let parsed = parser.parse(query).unwrap();
        let results = executor.execute(parsed).unwrap();
        let duration = start.elapsed();

        println!("{}", "Results:".green());
        for (i, result) in results.iter().enumerate() {
            println!("\n  {}. {}", i + 1, "Document".bold());
            println!("     Title: {}", result.doc.get_first("title").unwrap().text().unwrap());
            println!("     Content: {}", result.doc.get_first("content").unwrap().text().unwrap());
            println!("     Score: {:.4}", result.score);
        }
        
        println!("\n{} {:.2?}", "Time taken:".purple(), duration);
        println!("{} {}", "Total results:".purple(), results.len());
    }
}

fn main() {
    tokio::runtime::Runtime::new()
        .unwrap()
        .block_on(run_search_demo());
}

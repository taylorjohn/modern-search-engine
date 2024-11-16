use std::sync::Arc;
use tokio::sync::Mutex;
use warp::Filter;
use tantivy::{Index, doc, Document as TantivyDocument};
use tantivy::schema::{Schema, TEXT, STORED};
use std::net::SocketAddr;

mod search_handler;
mod search_result;
mod data_layer;
mod data_service;
mod semantic_analysis;
mod query_expander;
mod spell_checker;
mod trie;
mod tests;
mod scoring;
mod suggestions;

use crate::query_expander::QueryExpander;
use crate::spell_checker::SpellChecker;
use crate::trie::Trie;
use crate::semantic_analysis::SemanticAnalyzer;

async fn find_available_port(start_port: u16) -> Option<u16> {
    for port in start_port..65535 {
        if tokio::net::TcpListener::bind(format!("127.0.0.1:{}", port))
            .await
            .is_ok()
        {
            return Some(port);
        }
    }
    None
}

async fn create_sample_index() -> (Index, Schema) {
    // Create schema
    let mut schema_builder = Schema::builder();
    let title = schema_builder.add_text_field("title", TEXT | STORED);
    let body = schema_builder.add_text_field("body", TEXT | STORED);
    let category = schema_builder.add_text_field("category", STORED);
    let schema = schema_builder.build();

    // Create index
    let index = Index::create_in_ram(schema.clone());

    // Get index writer
    let mut index_writer = index.writer(50_000_000).expect("Failed to create index writer");

    // Add sample documents
    let sample_docs = vec![
        (
            "Introduction to Rust Programming",
            "Rust is a systems programming language that runs blazingly fast, prevents segfaults, and guarantees thread safety. Perfect for building reliable and efficient software.",
            "Programming"
        ),
        (
            "Machine Learning Basics",
            "Machine learning is a subset of artificial intelligence that gives systems the ability to learn without being explicitly programmed. Explore neural networks, deep learning, and more.",
            "Technology"
        ),
        (
            "Web Development Guide",
            "Learn modern web development using technologies like HTML5, CSS3, JavaScript, and various frameworks. Build responsive and dynamic web applications.",
            "Programming"
        ),
        (
            "Data Science Overview",
            "Data science combines statistics, mathematics, programming, and domain expertise to extract meaningful insights from data. Learn about analytics, visualization, and big data.",
            "Technology"
        ),
        (
            "Artificial Intelligence Ethics",
            "Exploring the ethical considerations and implications of AI development and deployment in society. Understanding bias, fairness, and responsible AI practices.",
            "Technology"
        ),
        (
            "Cloud Computing Fundamentals",
            "Understanding cloud services, deployment models, and infrastructure as code. Learn about AWS, Azure, and Google Cloud Platform.",
            "Technology"
        ),
        (
            "Cybersecurity Best Practices",
            "Essential security practices for protecting digital assets. Covering encryption, authentication, and threat detection.",
            "Security"
        ),
        (
            "Mobile App Development",
            "Building applications for iOS and Android platforms. Learn about native development, cross-platform frameworks, and mobile UI/UX.",
            "Programming"
        ),
        (
            "Database Design Principles",
            "Understanding relational and NoSQL databases. Learn about data modeling, normalization, and query optimization.",
            "Programming"
        ),
        (
            "DevOps and CI/CD",
            "Implementing continuous integration and deployment pipelines. Learn about Docker, Kubernetes, and automation tools.",
            "Technology"
        ),
        (
            "Internet of Things (IoT)",
            "Exploring connected devices and smart systems. Understanding sensors, networking, and IoT platforms.",
            "Technology"
        ),
        (
            "Blockchain Technology",
            "Understanding distributed ledger technology and smart contracts. Learn about cryptocurrencies and blockchain applications.",
            "Technology"
        ),
        (
            "UI/UX Design Fundamentals",
            "Principles of user interface and experience design. Learn about wireframing, prototyping, and user research.",
            "Design"
        ),
        (
            "Python Programming Guide",
            "Comprehensive guide to Python programming language. Covering data structures, algorithms, and best practices.",
            "Programming"
        ),
        (
            "Software Architecture Patterns",
            "Understanding common architectural patterns and their applications. Learn about microservices, monoliths, and serverless.",
            "Programming"
        )
    ];

    // Index the documents
    for (title_text, body_text, category_text) in sample_docs {
        let doc = doc!(
            title => title_text,
            body => body_text,
            category => category_text
        );
        index_writer.add_document(doc).expect("Failed to add document");
    }

    // Commit changes
    index_writer.commit().expect("Failed to commit changes");

    (index, schema)
}

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::fmt::init();

    // Find an available port starting from 3030
    let port = find_available_port(3030)
        .await
        .expect("No available ports found");

    // Create components with sample data
    let (index, schema) = create_sample_index().await;
    let index = Arc::new(index);
    
    let query_expander = Arc::new(QueryExpander::new());
    let spell_checker = Arc::new(SpellChecker::new());
    let trie_for_search = Arc::new(Trie::new());
    let semantic_analyzer = Arc::new(Mutex::new(SemanticAnalyzer::new().unwrap()));

    // Serve static files
    let static_files = warp::fs::dir("static");
    
    // Serve index.html at root
    let root = warp::path::end()
        .and(warp::fs::file("static/index.html"));

    // Set up search endpoint
    let search = warp::path("search")
        .and(warp::query::<std::collections::HashMap<String, String>>())
        .and(warp::any().map(move || index.clone()))
        .and(warp::any().map(move || Arc::new(schema.clone())))
        .and(warp::any().map(move || query_expander.clone()))
        .and(warp::any().map(move || spell_checker.clone()))
        .and(warp::any().map(move || trie_for_search.clone()))
        .and(warp::any().map(move || semantic_analyzer.clone()))
        .and_then(search_handler::handle_search);

    // Combine routes
    let routes = root
        .or(static_files)
        .or(search)
        .with(warp::cors().allow_any_origin())
        .with(warp::trace::request());

    // Create the address
    let addr: SocketAddr = format!("127.0.0.1:{}", port)
        .parse()
        .expect("Invalid address");

    // Start the server
    println!("Starting server at http://{}", addr);
    warp::serve(routes).run(addr).await;
}
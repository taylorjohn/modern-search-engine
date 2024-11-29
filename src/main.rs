use anyhow::Result;
use modern_search_engine::{setup, config::Config};
use std::sync::Arc;

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize logging
    tracing_subscriber::fmt::init();

    // Load config
    let config = Config::load()?;

    // Setup search engine and document processor
    let (engine, processor) = setup().await?;
    let engine = Arc::new(engine);
    let processor = Arc::new(processor);

    // Create routes
    let routes = api::routes::create_routes(engine, processor);

    // Start server
    warp::serve(routes)
        .run(([127, 0, 0, 1], 3030))
        .await;

    Ok(())
}

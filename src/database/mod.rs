pub mod migrations;

use anyhow::Result;
use sqlx::postgres::{PgPool, PgPoolOptions};

pub async fn create_pool(database_url: &str) -> Result<PgPool> {
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(database_url)
        .await?;

    // Run migrations
    migrations::run_migrations(&pool).await?;

    Ok(pool)
}

#[cfg(test)]
pub async fn create_test_pool() -> Result<PgPool> {
    let database_url = std::env::var("TEST_DATABASE_URL")
        .unwrap_or_else(|_| "postgres://localhost/search_engine_test".to_string());
    
    create_pool(&database_url).await
}
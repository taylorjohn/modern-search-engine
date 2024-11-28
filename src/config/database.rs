// src/config/database.rs

use sqlx::postgres::{PgPool, PgPoolOptions};
use anyhow::Result;
use std::time::Duration;

pub async fn create_pool() -> Result<PgPool> {
    let database_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set");

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .acquire_timeout(Duration::from_secs(3))
        .connect(&database_url)
        .await?;

    // Verify database connection
    sqlx::query("SELECT 1").execute(&pool).await?;

    Ok(pool)
}
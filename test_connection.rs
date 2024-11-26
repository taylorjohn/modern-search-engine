use sqlx::postgres::PgPoolOptions;
use tokio;

#[tokio::main]
async fn main() -> Result<(), sqlx::Error> {
    // Connection string - this is what your app will use
    let database_url = "postgres://postgres@localhost:5432/modern_search";
    
    // Try to create a connection pool
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(database_url)
        .await?;
    
    // Test query
    let row: (i64,) = sqlx::query_as("SELECT $1::BIGINT", )
        .bind(150_i64)
        .fetch_one(&pool)
        .await?;
        
    println!("Connection successful! Test query returned: {}", row.0);
    
    // Test our actual table
    let test_rows = sqlx::query!("SELECT * FROM connection_test")
        .fetch_all(&pool)
        .await?;
        
    println!("\nFound {} test rows", test_rows.len());
    for row in test_rows {
        println!("Message: {}", row.message);
    }
    
    Ok(())
}
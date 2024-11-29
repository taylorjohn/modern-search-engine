use sqlx::PgPool;
use anyhow::Result;

pub async fn run_migrations(pool: &PgPool) -> Result<()> {
    sqlx::query!(
        r#"
        CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            content_type TEXT NOT NULL,
            vector_embedding REAL[] NULL,
            metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        "#
    )
    .execute(pool)
    .await?;

    sqlx::query!(
        r#"
        CREATE INDEX IF NOT EXISTS idx_documents_content ON documents 
        USING gin(to_tsvector('english', content))
        "#
    )
    .execute(pool)
    .await?;

    sqlx::query!(
        r#"
        CREATE INDEX IF NOT EXISTS idx_documents_title ON documents 
        USING gin(to_tsvector('english', title))
        "#
    )
    .execute(pool)
    .await?;

    sqlx::query!(
        r#"
        CREATE OR REPLACE FUNCTION update_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql'
        "#
    )
    .execute(pool)
    .await?;

    sqlx::query!(
        r#"
        DROP TRIGGER IF EXISTS documents_updated_at ON documents;
        CREATE TRIGGER documents_updated_at
            BEFORE UPDATE ON documents
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at();
        "#
    )
    .execute(pool)
    .await?;

    Ok(())
}
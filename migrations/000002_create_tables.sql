-- migrations/000002_create_tables.sql
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    content_type TEXT NOT NULL,
    vector_embedding vector(384),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indices
CREATE INDEX IF NOT EXISTS documents_content_idx ON documents 
    USING gin (to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS documents_title_idx ON documents 
    USING gin (to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS documents_vector_idx ON documents 
    USING ivfflat (vector_embedding vector_cosine_ops);
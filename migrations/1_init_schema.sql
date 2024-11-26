-- migrations/1_init_schema.sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS processing_tasks CASCADE;

-- Create documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    content_type TEXT NOT NULL,
    author TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    vector_embedding vector(384),
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Add constraints
    CONSTRAINT valid_content_type CHECK (content_type IN ('text', 'pdf', 'html'))
);

-- Create processing tasks table
CREATE TABLE processing_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    progress FLOAT CHECK (progress BETWEEN 0 AND 100),
    message TEXT,
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indices
CREATE INDEX documents_content_idx ON documents USING gin (to_tsvector('english', content));
CREATE INDEX documents_title_idx ON documents USING gin (to_tsvector('english', title));
CREATE INDEX documents_metadata_idx ON documents USING gin (metadata);
CREATE INDEX documents_vector_idx ON documents USING ivfflat (vector_embedding vector_cosine_ops);

-- Create update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers
CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_processing_tasks_updated_at
    BEFORE UPDATE ON processing_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
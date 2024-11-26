-- migrations/20240323000000_init.sql

BEGIN;

-- Drop tables if they exist
DROP TABLE IF EXISTS processing_tasks;
DROP TABLE IF EXISTS documents;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Install vector extension using the proper path
SET LOCAL search_path TO public;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'vector'
    ) THEN
        -- Different possible paths for vector.sql based on installation
        -- Try installing from various possible locations
        BEGIN
            CREATE EXTENSION vector;
        EXCEPTION WHEN OTHERS THEN
            -- Log the error but continue
            RAISE NOTICE 'Could not create vector extension from default path: %', SQLERRM;
        END;
    END IF;
END
$$;

-- Core document table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    author TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- Make vector_embedding nullable since we'll update it asynchronously
    vector_embedding float[] NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create text search indices
CREATE INDEX documents_content_search_idx ON documents 
USING gin(to_tsvector('english', content));

CREATE INDEX documents_title_search_idx ON documents 
USING gin(to_tsvector('english', title));

-- Processing status tracking
CREATE TABLE processing_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    progress FLOAT NOT NULL DEFAULT 0,
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indices for better query performance
CREATE INDEX idx_processing_tasks_status ON processing_tasks(status);
CREATE INDEX idx_processing_tasks_document ON processing_tasks(document_id);

-- Automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for timestamp updates
CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_processing_tasks_updated_at
    BEFORE UPDATE ON processing_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;
-- migrations/20240324000000_init_vector_support.sql

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS processing_tasks;
DROP TABLE IF EXISTS search_history;

-- Create documents table with vector support
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    author TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    vector_embedding vector(384),  -- Using pgvector type
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Add constraints
    CONSTRAINT valid_content_type CHECK (content_type IN ('text', 'pdf', 'html')),
    CONSTRAINT valid_vector_dim CHECK (array_length(vector_embedding::float8[], 1) = 384)
);

-- Create indices for efficient search
CREATE INDEX documents_content_idx ON documents USING gin (to_tsvector('english', content));
CREATE INDEX documents_title_idx ON documents USING gin (to_tsvector('english', title));
CREATE INDEX documents_metadata_idx ON documents USING gin (metadata);
CREATE INDEX documents_vector_idx ON documents USING ivfflat (vector_embedding vector_cosine_ops) WITH (lists = 100);

-- Processing tasks table for async document processing
CREATE TABLE processing_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    progress FLOAT CHECK (progress BETWEEN 0 AND 100),
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Search history for analytics
CREATE TABLE search_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query TEXT NOT NULL,
    vector_query BOOLEAN DEFAULT false,
    execution_time_ms INTEGER,
    results_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    search_params JSONB DEFAULT '{}'::jsonb
);

-- Update trigger for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add update triggers
CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_processing_tasks_updated_at
    BEFORE UPDATE ON processing_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Helper function for vector similarity search
CREATE OR REPLACE FUNCTION vector_similarity(
    query_embedding vector(384),
    limit_val integer DEFAULT 10,
    threshold float DEFAULT 0.7
) RETURNS TABLE (
    id UUID,
    similarity float
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        documents.id,
        1 - (documents.vector_embedding <-> query_embedding) as similarity
    FROM documents
    WHERE documents.vector_embedding IS NOT NULL
    AND 1 - (documents.vector_embedding <-> query_embedding) > threshold
    ORDER BY similarity DESC
    LIMIT limit_val;
END;
$$ LANGUAGE plpgsql;

-- Helper function for hybrid search
CREATE OR REPLACE FUNCTION hybrid_search(
    search_query text,
    query_embedding vector(384),
    text_weight float DEFAULT 0.3,
    vector_weight float DEFAULT 0.7,
    limit_val integer DEFAULT 10
) RETURNS TABLE (
    id UUID,
    title text,
    content text,
    text_score float,
    vector_score float,
    combined_score float
) AS $$
BEGIN
    RETURN QUERY
    WITH search_scores AS (
        SELECT 
            d.id,
            d.title,
            d.content,
            ts_rank(to_tsvector('english', d.content), plainto_tsquery(search_query)) as text_score,
            CASE 
                WHEN d.vector_embedding IS NOT NULL 
                THEN 1 - (d.vector_embedding <-> query_embedding)
                ELSE 0
            END as vector_score
        FROM documents d
        WHERE 
            to_tsvector('english', d.content) @@ plainto_tsquery(search_query)
            OR d.vector_embedding IS NOT NULL
    )
    SELECT 
        id,
        title,
        content,
        text_score,
        vector_score,
        (text_score * text_weight + vector_score * vector_weight) as combined_score
    FROM search_scores
    ORDER BY combined_score DESC
    LIMIT limit_val;
END;
$$ LANGUAGE plpgsql;
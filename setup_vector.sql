
cat > setup_vector.sql << 'EOL'
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- Drop existing tables if needed
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS vector_test;

-- Create test table
CREATE TABLE vector_test (
    id serial primary key,
    embedding vector(384)
);

-- Create documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    author TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    vector_embedding vector(384),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes
CREATE INDEX documents_content_idx ON documents USING gin (to_tsvector('english', content));
CREATE INDEX documents_title_idx ON documents USING gin (to_tsvector('english', title));
CREATE INDEX documents_vector_idx ON documents USING ivfflat (vector_embedding vector_cosine_ops);

-- Insert test vector
INSERT INTO vector_test (embedding) 
VALUES ('[1,2,3]'::vector);

-- Test vector operations
SELECT id, 1 - (embedding <-> '[1,2,3]'::vector) as similarity 
FROM vector_test 
ORDER BY similarity DESC 
LIMIT 1;
EOL
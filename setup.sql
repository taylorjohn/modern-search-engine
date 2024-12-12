# Create a setup.sql file
echo "
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION vector_similarity(a vector(384), b vector(384)) 
RETURNS float8 AS \$\$
SELECT 1 - (a <=> b);
\$\$ LANGUAGE SQL IMMUTABLE STRICT PARALLEL SAFE;

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    vector_embedding vector(384),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_documents_vector 
ON documents USING ivfflat (vector_embedding vector_cosine_ops)
WITH (lists = 100);
" > setup.sql

# Run the SQL file
psql -U dev -d modern_search -f setup.sql
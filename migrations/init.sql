-- Create extension for vector operations
CREATE EXTENSION IF NOT EXISTS vector;

-- Documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    author TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    vector_embedding vector(384),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create GiST index for vector similarity search
CREATE INDEX documents_vector_embedding_idx ON documents 
USING ivfflat (vector_embedding vector_cosine_ops)
WITH (lists = 100);

-- Create text search configuration
CREATE TEXT SEARCH CONFIGURATION search_config (COPY = english);

-- Create text search index
CREATE INDEX documents_content_search_idx ON documents
USING GIN (to_tsvector('search_config', content));
CREATE INDEX documents_title_search_idx ON documents
USING GIN (to_tsvector('search_config', title));

-- Tags table
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE
);

-- Document tags junction table
CREATE TABLE document_tags (
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (document_id, tag_id)
);

-- Processing status table
CREATE TABLE processing_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status VARCHAR(50) NOT NULL,
    progress FLOAT DEFAULT 0,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    error TEXT
);

-- Search history table
CREATE TABLE search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query TEXT NOT NULL,
    user_id UUID,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    result_count INTEGER,
    execution_time_ms INTEGER,
    filters JSONB
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_processing_tasks_updated_at
    BEFORE UPDATE ON processing_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX idx_documents_created_at ON documents(created_at);
CREATE INDEX idx_documents_content_type ON documents(content_type);
CREATE INDEX idx_processing_tasks_status ON processing_tasks(status);
CREATE INDEX idx_search_history_timestamp ON search_history(timestamp);

-- Create function to search documents
CREATE OR REPLACE FUNCTION search_documents(
    query_text TEXT,
    limit_val INTEGER DEFAULT 10,
    offset_val INTEGER DEFAULT 0
) RETURNS TABLE (
    id UUID,
    title TEXT,
    content TEXT,
    similarity FLOAT,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.title,
        d.content,
        ts_rank_cd(to_tsvector('search_config', d.content), plainto_tsquery('search_config', query_text)) 
        + ts_rank_cd(to_tsvector('search_config', d.title), plainto_tsquery('search_config', query_text)) AS similarity,
        d.metadata
    FROM documents d
    WHERE 
        to_tsvector('search_config', d.content) @@ plainto_tsquery('search_config', query_text)
        OR to_tsvector('search_config', d.title) @@ plainto_tsquery('search_config', query_text)
    ORDER BY similarity DESC

LIMIT limit_val
    OFFSET offset_val;
END;
$$ LANGUAGE plpgsql;

-- Create function for vector similarity search
CREATE OR REPLACE FUNCTION vector_search_documents(
    query_embedding vector(384),
    limit_val INTEGER DEFAULT 10,
    threshold FLOAT DEFAULT 0.7
) RETURNS TABLE (
    id UUID,
    title TEXT,
    content TEXT,
    similarity FLOAT,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.title,
        d.content,
        1 - (d.vector_embedding <=> query_embedding) as similarity,
        d.metadata
    FROM documents d
    WHERE 1 - (d.vector_embedding <=> query_embedding) > threshold
    ORDER BY similarity DESC
    LIMIT limit_val;
END;
$$ LANGUAGE plpgsql;

-- Create function for hybrid search
CREATE OR REPLACE FUNCTION hybrid_search_documents(
    query_text TEXT,
    query_embedding vector(384),
    text_weight FLOAT DEFAULT 0.4,
    vector_weight FLOAT DEFAULT 0.6,
    limit_val INTEGER DEFAULT 10
) RETURNS TABLE (
    id UUID,
    title TEXT,
    content TEXT,
    text_similarity FLOAT,
    vector_similarity FLOAT,
    final_score FLOAT,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH text_search AS (
        SELECT 
            d.id,
            d.title,
            d.content,
            d.metadata,
            ts_rank_cd(to_tsvector('search_config', d.content), plainto_tsquery('search_config', query_text)) 
            + ts_rank_cd(to_tsvector('search_config', d.title), plainto_tsquery('search_config', query_text)) AS text_sim
        FROM documents d
        WHERE 
            to_tsvector('search_config', d.content) @@ plainto_tsquery('search_config', query_text)
            OR to_tsvector('search_config', d.title) @@ plainto_tsquery('search_config', query_text)
    ),
    vector_search AS (
        SELECT 
            d.id,
            1 - (d.vector_embedding <=> query_embedding) as vector_sim
        FROM documents d
    )
    SELECT 
        ts.id,
        ts.title,
        ts.content,
        ts.text_sim as text_similarity,
        COALESCE(vs.vector_sim, 0) as vector_similarity,
        (ts.text_sim * text_weight + COALESCE(vs.vector_sim, 0) * vector_weight) as final_score,
        ts.metadata
    FROM text_search ts
    LEFT JOIN vector_search vs ON ts.id = vs.id
    ORDER BY final_score DESC
    LIMIT limit_val;
END;
$$ LANGUAGE plpgsql;

-- Create materialized view for popular searches
CREATE MATERIALIZED VIEW popular_searches AS
SELECT 
    query,
    COUNT(*) as search_count,
    AVG(execution_time_ms) as avg_execution_time,
    MAX(timestamp) as last_searched
FROM search_history
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY query
ORDER BY search_count DESC;

-- Create index on materialized view
CREATE UNIQUE INDEX popular_searches_query_idx ON popular_searches(query);

-- Create refresh function for materialized view
CREATE OR REPLACE FUNCTION refresh_popular_searches()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY popular_searches;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to refresh popular searches
CREATE TRIGGER refresh_popular_searches_trigger
AFTER INSERT ON search_history
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_popular_searches();
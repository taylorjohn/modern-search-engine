CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    vector_embedding float4[] NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_documents_title ON documents USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_documents_content ON documents USING gin(to_tsvector('english', content));

-- Create function for L2 distance calculation
CREATE OR REPLACE FUNCTION l2_distance(a float4[], b float4[])
RETURNS float8 AS $$
DECLARE
    sum float8 := 0;
    i integer;
BEGIN
    IF array_length(a, 1) <> array_length(b, 1) THEN
        RETURN NULL;
    END IF;
    FOR i IN 1..array_length(a, 1) LOOP
        sum := sum + power(a[i] - b[i], 2);
    END LOOP;
    RETURN sqrt(sum);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_documents_vector ON documents USING gist (vector_embedding gist_l2_ops);
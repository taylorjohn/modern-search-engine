-- migrations/000001_init_extensions.sql
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS vector;
    
    -- Create vector similarity functions
    CREATE OR REPLACE FUNCTION vector_cosine_similarity(a vector, b vector) 
    RETURNS float8 AS $$
    SELECT 1 - (a <=> b)::float8;
    $$ LANGUAGE SQL IMMUTABLE STRICT PARALLEL SAFE;

EXCEPTION 
    WHEN OTHERS THEN
        NULL;
END $$;
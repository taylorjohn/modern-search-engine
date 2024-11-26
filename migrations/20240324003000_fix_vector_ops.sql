-- migrations/20240324003000_fix_vector_ops.sql

-- First ensure pgvector extension is enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Drop existing index
DROP INDEX IF EXISTS documents_vector_idx;

-- Modify the vector_embedding column to use vector type
ALTER TABLE documents 
  ALTER COLUMN vector_embedding TYPE vector(384) 
  USING nullif(vector_embedding::text, '')::vector(384);

-- Create index using correct operator
CREATE INDEX documents_vector_idx ON documents 
  USING ivfflat (vector_embedding vector_cosine_ops);

-- Add constraint to ensure correct dimension
ALTER TABLE documents 
  ADD CONSTRAINT check_vector_dim 
  CHECK (vector_embedding IS NULL OR array_length(vector_embedding::float8[], 1) = 384);
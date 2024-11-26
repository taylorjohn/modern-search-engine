-- migrations/20240324002000_fix_vector_handling.sql
-- Drop existing indices
DROP INDEX IF EXISTS documents_vector_idx;

-- Update vector_embedding column type
ALTER TABLE documents 
  ALTER COLUMN vector_embedding TYPE float4[] USING vector_embedding::float4[];

-- Create new index for vector search
CREATE INDEX documents_vector_idx ON documents 
  USING ivfflat (vector_embedding vector_l2_ops) 
  WITH (lists = 100);
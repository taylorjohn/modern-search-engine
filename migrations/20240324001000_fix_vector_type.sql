-- Create a migration file: migrations/20240324001000_fix_vector_type.sql
DROP INDEX IF EXISTS documents_vector_idx;
ALTER TABLE documents 
  ALTER COLUMN vector_embedding TYPE vector(384) USING vector_embedding::vector(384);
CREATE INDEX documents_vector_idx ON documents USING ivfflat (vector_embedding vector_cosine_ops);
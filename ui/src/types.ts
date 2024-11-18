export interface SearchResult {
  id: string;
  title: string;
  content: string;
  scores: {
    text_score: number;
    vector_score: number;
    final_score: number;
  };
  highlights: string[];
  metadata: {
    source_type: string;
    author?: string;
    created_at: string;
    word_count: number;
  };
}

export interface SearchResponse {
  query: {
    original: string;
    expanded: string;
    vector_query: boolean;
  };
  results: SearchResult[];
  analytics: SearchAnalytics;
}

export interface SearchAnalytics {
  execution_time_ms: number;
  total_results: number;
  max_score: number;
  search_type: string;
  vector_query: boolean;
}

export interface ProcessingStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message?: string;
  result?: ProcessedDocument;
}

export interface ProcessedDocument {
  id: string;
  title: string;
  content_type: string;
  word_count: number;
  vector_embedding: number[];
  language?: string;
  processing_time_ms: number;
  metadata: {
    source_type: string;
    author?: string;
    tags: string[];
  };
}

export interface DocumentUpload {
  type: 'pdf' | 'html' | 'text';
  content: string;
  title?: string;
  metadata?: {
    author?: string;
    tags?: string[];
  };
}
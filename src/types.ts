// src/types.ts
export interface SearchResult {
  id: string;
  title: string;
  content: string;
  author: string;
  tags: string[];
  highlights: string[];
  matches: Array<{
    field: string;
    term: string;
    count: number;
  }>;
  scores: {
    text_score: number;
    vector_score: number;
    final_score: number;
    field_scores: Array<{
      field: string;
      score: number;
      weight: number;
    }>;
  };
  metadata: {
    source_type: string;
    word_count: number;
    created_at: string;
    last_modified: string;
  };
}

export interface SearchAnalytics {
  execution_time_ms: number;
  total_results: number;
  max_score: number;
  search_type: string;
  vector_query: boolean;
  field_weights: Record<string, number>;
  query_analysis: {
    original: string;
    expanded: string;
    tokens: string[];
    stopwords_removed: string[];
  };
  performance: {
    vector_time_ms: number;
    text_time_ms: number;
    total_time_ms: number;
    result_count: number;
  };
}

export interface SearchRequest {
  query: string;
  filters?: SearchFilters;
  options?: SearchOptions;
  page?: number;
  limit?: number;
}

export interface SearchResponse {
  results: SearchResult[];
  analytics: SearchAnalytics;
  pagination: {
    current_page: number;
    total_pages: number;
    total_results: number;
    has_more: boolean;
  };
}

export interface SearchFilters {
  author?: string;
  dateRange?: {
    from: Date | null;
    to: Date | null;
  };
  contentType?: string[];
  tags?: string[];
}

export interface SearchOptions {
  useVector: boolean;
  boost: {
    title: number;
    content: number;
    tags: number;
  };
}

export interface ProcessingStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message?: string;
  result?: {
    id: string;
    title: string;
    content_type: string;
    word_count: number;
    vector_embedding: number[];
    language?: string;
    processing_time_ms: number;
  };
  error?: string;
}
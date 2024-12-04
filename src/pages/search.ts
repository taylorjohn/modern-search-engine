// src/types/search.ts
export interface SearchResult {
  id: string;
  title: string;
  content: string;
  highlights: string[];
  scores: {
    text_score: number;
    vector_score: number;
    final_score: number;
    title_score: number;
    content_score: number;
  };
  metadata: {
    type: string;
    word_count: number;
    language: string;
    created_at: string;
    updated_at: string;
    tags?: string[];
  };
}

export interface SearchAnalytics {
  total_results: number;
  execution_time_ms: number;
  max_score: number;
  vector_search: boolean;
}

export interface SearchRequest {
  query: string;
  filters?: {
    contentTypes?: string[];
    minScore?: number;
    useVectorSearch?: boolean;
  };
  options?: {
    includeHighlights?: boolean;
    includeScores?: boolean;
  };
}

export interface SearchResponse {
  results: SearchResult[];
  analytics: SearchAnalytics;
}
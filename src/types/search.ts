export interface SearchHistoryItem {
  query: string;
  timestamp: string;
  results: number;
  executionTime: number;
  filters: {
    contentTypes: string[];
    authors: string[];
  };
}

export interface SearchFilters {
  contentTypes: string[];
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  authors: string[];
}

export interface SearchAnalytics {
  execution_time_ms: number;
  total_results: number;
  max_score: number;
  vector_query: boolean;
  result_distribution: {
    content_type: string;
    count: number;
  }[];
  score_ranges: {
    range: string;
    count: number;
  }[];
  timing_breakdown: {
    phase: string;
    time_ms: number;
  }[];
}
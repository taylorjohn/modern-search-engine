// src/types/search.ts

export interface SearchFilters {
  contentTypes: string[];
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  authors: string[];
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: number;
  results: number;
  executionTime: number;
  filters: SearchFilters;
}

export interface SearchStats {
  totalQueries: number;
  averageTime: number;
  topQueries: Array<{
    query: string;
    count: number;
  }>;
  resultDistribution: Array<{
    range: string;
    count: number;
  }>;
}

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  url: string;
  scores: {
    textScore: number;
    vectorScore: number;
    finalScore: number;
    similarityScores?: Array<{
      documentId: string;
      score: number;
      reason: string;
    }>;
  };
  metadata: {
    author: string;
    created: string;
    modified?: string;
    wordCount: number;
    type: string;
    language?: string;
    fileSize?: number;
    vectorDimensions?: number;
    sourcePath?: string;
  };
  tags: string[];
  embedding?: number[]; // Vector representation
}

export interface ProcessingStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message?: string;
  error?: string;
  result?: {
    id: string;
    title: string;
    content_type: string;
    word_count: number;
    vector_embedding: number[];
    language?: string;
    processing_time_ms: number;
  };
}
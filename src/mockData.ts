// src/mockData.ts
import { SearchResult } from './types';

export const mockDocuments: SearchResult[] = [
  {
    id: "1",
    title: "Introduction to Vector Search Engines",
    content: "Vector search is a modern approach to information retrieval that uses numerical representations...",
    author: "John Doe",
    tags: ["search", "vectors", "machine-learning"],
    highlights: [],
    matches: [],
    scores: {
      text_score: 0.85,
      vector_score: 0.92,
      final_score: 0.89,
      field_scores: [
        { field: "title", score: 0.95, weight: 1.5 },
        { field: "content", score: 0.82, weight: 1.0 }
      ]
    },
    metadata: {
      source_type: "technical_article",
      word_count: 1250,
      created_at: "2024-03-01T10:00:00Z",
      last_modified: "2024-03-05T15:30:00Z"
    }
  },
  // Add more mock documents with the same structure...
];
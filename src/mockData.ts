// src/mockData.ts
export interface MockDocument {
  id: string;
  title: string;
  content: string;
  documentType: 'pdf' | 'html' | 'text' | 'markdown' | 'code';
  scores: {
    textScore: number;
    vectorScore: number;
    finalScore: number;
  };
  metadata: {
    author: string;
    created: string;
    wordCount: number;
    type: string;
  };
  tags: string[];
}

export const mockStats = {
  time: '0.23s',
  results: 5,
  score: '95.2%',
  mode: 'Hybrid'
};

export const mockSearchHistory = [
  { query: 'vector search', results: 5 },
  { query: 'embeddings', results: 3 },
  { query: 'semantic search', results: 7 }
];

export async function mockSearch(query: string): Promise<MockDocument[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  return [
    {
      id: '1',
      title: 'Introduction to Vector Search',
      content: 'A comprehensive guide to understanding vector search and its applications...',
      documentType: 'markdown',
      scores: {
        textScore: 0.92,
        vectorScore: 0.88,
        finalScore: 0.95
      },
      metadata: {
        author: 'John Doe',
        created: '2024-01-15',
        wordCount: 1250,
        type: 'technical'
      },
      tags: ['vector search', 'machine learning', 'tutorial']
    },
    {
      id: '2',
      title: 'Vector Search Implementation',
      content: 'Step-by-step guide to implementing vector search in your applications...',
      documentType: 'code',
      scores: {
        textScore: 0.85,
        vectorScore: 0.90,
        finalScore: 0.88
      },
      metadata: {
        author: 'Jane Smith',
        created: '2024-01-20',
        wordCount: 2000,
        type: 'implementation'
      },
      tags: ['code', 'implementation', 'guide']
    },
    // Add more mock documents as needed
  ];
}
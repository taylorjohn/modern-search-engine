export interface MockDocument {
  id: string;
  title: string;
  content: string;
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

export const mockDocuments: MockDocument[] = [
  {
    id: '1',
    title: 'Introduction to Vector Search',
    content: 'A comprehensive guide to understanding vector search and its applications in modern search engines. This document covers fundamental concepts and practical implementations.',
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
    tags: ['search', 'vector', 'machine-learning']
  },
  {
    id: '2',
    title: 'Exploring Neural Networks for NLP',
    content: 'Neural networks have revolutionized natural language processing by enabling tasks like sentiment analysis, text generation, and machine translation...',
    scores: {
      textScore: 0.83,
      vectorScore: 0.90,
      finalScore: 0.89
    },
    metadata: {
      author: 'Alice Smith',
      created: '2024-01-20',
      wordCount: 1800,
      type: 'research'
    },
    tags: ['machine-learning', 'NLP', 'deep-learning']
  },
  {
    id: '3',
    title: 'Semantic Search Implementation Guide',
    content: 'Step-by-step guide to implementing semantic search in modern applications. Includes code examples and best practices.',
    scores: {
      textScore: 0.95,
      vectorScore: 0.87,
      finalScore: 0.91
    },
    metadata: {
      author: 'Bob Johnson',
      created: '2024-02-01',
      wordCount: 2200,
      type: 'tutorial'
    },
    tags: ['semantic-search', 'implementation', 'tutorial']
  },
  {
    id: '4',
    title: 'Vector Databases Comparison',
    content: 'Detailed comparison of popular vector databases including performance metrics, features, and use cases.',
    scores: {
      textScore: 0.88,
      vectorScore: 0.92,
      finalScore: 0.90
    },
    metadata: {
      author: 'Emma Wilson',
      created: '2024-02-10',
      wordCount: 1600,
      type: 'analysis'
    },
    tags: ['database', 'comparison', 'vector-db']
  }
];

export const mockSearchHistory = [
  { query: 'vector search', results: 5 },
  { query: 'embeddings', results: 3 },
  { query: 'semantic search', results: 7 },
  { query: 'neural networks', results: 4 },
  { query: 'machine learning', results: 6 }
];

export const mockStats = {
  time: '45ms',
  results: 4,
  score: '92%',
  mode: 'Hybrid'
};

// Simulated search function with delay
export async function mockSearch(query: string): Promise<MockDocument[]> {
  await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
  
  return mockDocuments.filter(doc => 
    doc.title.toLowerCase().includes(query.toLowerCase()) ||
    doc.content.toLowerCase().includes(query.toLowerCase()) ||
    doc.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
  );
}
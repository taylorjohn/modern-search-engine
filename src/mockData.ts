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

export const enhancedMockDocuments: MockDocument[] = [
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
  {
    id: '3',
    title: 'Semantic Search Techniques',
    content: 'An overview of modern semantic search techniques and applications...',
    documentType: 'pdf',
    scores: {
      textScore: 0.80,
      vectorScore: 0.92,
      finalScore: 0.86
    },
    metadata: {
      author: 'Alex Johnson',
      created: '2024-02-05',
      wordCount: 1800,
      type: 'research'
    },
    tags: ['semantic search', 'nlp', 'research']
  },
  {
    id: '4',
    title: 'Building a Modern Search Engine',
    content: 'Learn how to build a modern search engine with advanced features...',
    documentType: 'html',
    scores: {
      textScore: 0.88,
      vectorScore: 0.85,
      finalScore: 0.87
    },
    metadata: {
      author: 'Sarah Lee',
      created: '2024-01-30',
      wordCount: 2200,
      type: 'tutorial'
    },
    tags: ['search engine', 'development', 'tutorial']
  }
];

export async function mockSearch(query: string): Promise<MockDocument[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Filter documents based on query
  return enhancedMockDocuments.filter(doc => {
    const searchText = `${doc.title} ${doc.content}`.toLowerCase();
    return searchText.includes(query.toLowerCase());
  });
}
export interface MockDocument {
  id: string;
  title: string;
  content: string;
  documentType: 'pdf' | 'html' | 'text' | 'markdown' | 'code';
  scores: {
    textScore: number;
    vectorScore: number;
    finalScore: number;
    similarityScores?: {
      documentId: string;
      score: number;
      reason: string;
    }[];
  };
  metadata: {
    author: string;
    created: string;
    wordCount: number;
    type: string;
    language?: string;
    fileSize?: number;
    vectorDimensions?: number;
  };
  tags: string[];
}

export const mockSearch = async (query: string): Promise<MockDocument[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  if (query === 'test') {
    return [{
      id: '1',
      title: 'Test Document',
      content: 'This is a test document content.',
      documentType: 'text',
      scores: {
        textScore: 0.85,
        vectorScore: 0.92,
        finalScore: 0.89,
      },
      metadata: {
        author: 'Test Author',
        created: new Date().toISOString(),
        wordCount: 150,
        type: 'text'
      },
      tags: ['test', 'document']
    }];
  }

  return [];
};

export const mockSearchHistory = [
  { query: 'vector search', results: 5 },
  { query: 'embeddings', results: 3 },
  { query: 'semantic search', results: 7 }
];

export const mockStats = {
  time: '0.5s',
  results: 0,
  score: '0%',
  mode: 'vector'
};

export const processFile = async (file: File, onProgress: (progress: number) => void) => {
  // Simulate file processing
  const total = 100;
  let progress = 0;

  while (progress < total) {
    await new Promise(resolve => setTimeout(resolve, 50));
    progress += 10;
    onProgress(progress);
  }

  return {
    id: Math.random().toString(36).substr(2, 9),
    filename: file.name,
    type: file.type,
    size: file.size,
    content: await file.text(),
    timestamp: new Date().toISOString()
  };
};
// src/__tests__/mocks/data.mock.ts
export const mockSearchResults = [
  {
    id: '1',
    title: 'Test Document 1',
    content: 'This is a test document content',
    scores: {
      textScore: 0.85,
      vectorScore: 0.92,
      finalScore: 0.90,
      similarityScores: [
        { documentId: '2', score: 0.82, reason: 'Similar content' }
      ]
    },
    metadata: {
      author: 'Test Author',
      created: '2024-01-01',
      wordCount: 150,
      type: 'document',
      language: 'en',
      vectorDimensions: 384
    },
    tags: ['test', 'document']
  }
];

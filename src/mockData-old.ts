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
    embedding?: number[]; // Simplified vector representation
  }
  
  export const enhancedMockDocuments: MockDocument[] = [
    {
      id: '1',
      title: 'Introduction to Vector Search',
      content: 'A comprehensive guide to understanding vector search and its applications in modern search engines.',
      documentType: 'markdown',
      scores: {
        textScore: 0.92,
        vectorScore: 0.88,
        finalScore: 0.95,
        similarityScores: [
          { documentId: '2', score: 0.82, reason: 'Shared ML concepts' },
          { documentId: '3', score: 0.85, reason: 'Search implementation overlap' }
        ]
      },
      metadata: {
        author: 'John Doe',
        created: '2024-01-15',
        wordCount: 1250,
        type: 'technical',
        language: 'en',
        vectorDimensions: 384
      },
      tags: ['search', 'vector', 'machine-learning'],
      embedding: [0.2, 0.5, -0.1, 0.8] // Simplified vector for demonstration
    },
    {
      id: '2',
      title: 'Vector Search Code Implementation',
      content: 'Example code implementing vector search using Python and numpy.',
      documentType: 'code',
      scores: {
        textScore: 0.78,
        vectorScore: 0.95,
        finalScore: 0.89,
        similarityScores: [
          { documentId: '1', score: 0.82, reason: 'Implementation of concepts' },
          { documentId: '4', score: 0.88, reason: 'Similar code patterns' }
        ]
      },
      metadata: {
        author: 'Alice Chen',
        created: '2024-01-18',
        wordCount: 800,
        type: 'code',
        language: 'python',
        fileSize: 15240,
        vectorDimensions: 384
      },
      tags: ['python', 'code', 'implementation'],
      embedding: [0.21, 0.48, -0.15, 0.79]
    },
    {
      id: '3',
      title: 'Vector Search Architecture PDF',
      content: 'Technical whitepaper on vector search system architecture and design patterns.',
      documentType: 'pdf',
      scores: {
        textScore: 0.91,
        vectorScore: 0.87,
        finalScore: 0.92,
        similarityScores: [
          { documentId: '1', score: 0.85, reason: 'Architecture concepts' },
          { documentId: '5', score: 0.79, reason: 'System design overlap' }
        ]
      },
      metadata: {
        author: 'Sarah Johnson',
        created: '2024-01-20',
        wordCount: 3500,
        type: 'whitepaper',
        language: 'en',
        fileSize: 2457600,
        vectorDimensions: 384
      },
      tags: ['architecture', 'pdf', 'technical'],
      embedding: [0.18, 0.52, -0.08, 0.83]
    },
    {
      id: '4',
      title: 'Vector Search API Documentation',
      content: 'API documentation for a vector search service with example requests and responses.',
      documentType: 'html',
      scores: {
        textScore: 0.85,
        vectorScore: 0.92,
        finalScore: 0.90,
        similarityScores: [
          { documentId: '2', score: 0.88, reason: 'Implementation details' },
          { documentId: '3', score: 0.76, reason: 'Technical overlap' }
        ]
      },
      metadata: {
        author: 'Dev Team',
        created: '2024-01-25',
        wordCount: 1800,
        type: 'documentation',
        language: 'en',
        vectorDimensions: 384
      },
      tags: ['api', 'documentation', 'reference'],
      embedding: [0.22, 0.49, -0.12, 0.81]
    },
    {
      id: '5',
      title: 'Vector Search Performance Analysis',
      content: 'Detailed analysis of vector search performance across different implementations and datasets.',
      documentType: 'text',
      scores: {
        textScore: 0.88,
        vectorScore: 0.94,
        finalScore: 0.91,
        similarityScores: [
          { documentId: '3', score: 0.79, reason: 'Performance concepts' },
          { documentId: '4', score: 0.81, reason: 'Implementation analysis' }
        ]
      },
      metadata: {
        author: 'Research Team',
        created: '2024-02-01',
        wordCount: 2500,
        type: 'analysis',
        language: 'en',
        vectorDimensions: 384
      },
      tags: ['performance', 'analysis', 'benchmarks'],
      embedding: [0.19, 0.51, -0.11, 0.82]
    }
  ];
  
  export function findSimilarDocuments(documentId: string): MockDocument[] {
    const sourceDoc = enhancedMockDocuments.find(doc => doc.id === documentId);
    if (!sourceDoc?.scores.similarityScores) return [];
    
    return sourceDoc.scores.similarityScores
      .map(similarity => ({
        document: enhancedMockDocuments.find(doc => doc.id === similarity.documentId)!,
        similarityScore: similarity.score,
        reason: similarity.reason
      }))
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .map(result => result.document);
  }
  
  export const mockSearchHistoryWithTypes = [
    { query: 'vector search', results: 5, documentTypes: ['pdf', 'markdown', 'code'] },
    { query: 'embeddings', results: 3, documentTypes: ['text', 'html'] },
    { query: 'semantic search', results: 7, documentTypes: ['markdown', 'pdf', 'text'] },
    { query: 'implementation', results: 4, documentTypes: ['code', 'html'] }
  ];
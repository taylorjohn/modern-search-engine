// src/services/mockApi.ts
import { logger } from '@/services/logger';

export const mockSearchResults = {
  query: {
    original: "test query",
    expanded: "test query search find",
    vector_query: true
  },
  results: [
    {
      id: "1",
      title: "Test Document 1",
      content: "This is a test document about machine learning and AI",
      scores: {
        text_score: 0.85,
        vector_score: 0.92,
        final_score: 0.89
      },
      metadata: {
        source_type: "pdf",
        content_type: "application/pdf",
        author: "John Doe",
        created_at: "2024-03-24T10:00:00Z",
        last_modified: "2024-03-24T10:00:00Z",
        word_count: 150,
        tags: ["AI", "ML", "research"],
        custom_metadata: {
          department: "Research",
          priority: "High"
        }
      },
      highlights: [
        "This is a <em>test</em> document",
        "about <em>machine learning</em>"
      ]
    },
    {
      id: "2",
      title: "Vector Embeddings Guide",
      content: "Understanding vector embeddings and similarity search",
      scores: {
        text_score: 0.75,
        vector_score: 0.88,
        final_score: 0.82
      },
      metadata: {
        source_type: "html",
        content_type: "text/html",
        author: "Jane Smith",
        created_at: "2024-03-23T15:30:00Z",
        last_modified: "2024-03-24T09:20:00Z",
        word_count: 300,
        tags: ["vectors", "embeddings", "search"],
        custom_metadata: {
          category: "Technical",
          level: "Advanced"
        }
      },
      highlights: [
        "Understanding <em>vector</em> embeddings",
        "<em>similarity search</em>"
      ]
    }
  ],
  analytics: {
    execution_time_ms: 45,
    total_results: 2,
    max_score: 0.89,
    search_type: "hybrid",
    vector_query: true,
    field_weights: {
      title: 1.5,
      content: 1.0,
      tags: 0.5
    }
  }
};

// Mock database of documents
const mockDocuments = new Map([
  ['1', {
    id: "1",
    title: "Test Document 1",
    content: "This is a test document about machine learning and AI",
    contentType: "application/pdf",
    author: "John Doe",
    createdAt: "2024-03-24T10:00:00Z",
    lastModified: "2024-03-24T10:00:00Z",
    wordCount: 150,
    tags: ["AI", "ML", "research"],
    vectorEmbedding: Array(384).fill(0.1),
  }],
  ['2', {
    id: "2",
    title: "Vector Embeddings Guide",
    content: "Understanding vector embeddings and similarity search",
    contentType: "text/html",
    author: "Jane Smith",
    createdAt: "2024-03-23T15:30:00Z",
    lastModified: "2024-03-24T09:20:00Z",
    wordCount: 300,
    tags: ["vectors", "embeddings", "search"],
    vectorEmbedding: Array(384).fill(0.2),
  }]
]);

/**
 * Simulates network delay for mock API calls
 * @param minMs - Minimum delay in milliseconds
 * @param maxMs - Maximum delay in milliseconds
 * @returns Promise that resolves after random delay
 */
async function simulateNetworkDelay(minMs = 200, maxMs = 600) {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  await new Promise(resolve => setTimeout(resolve, delay));
  return delay;
}

/**
 * Mocks backend API for testing/development
 */
export const mockApi = {
  /**
   * Performs a mock search
   * @param query - Search query
   * @returns Mock search results
   */
  search: async (query: string) => {
    const delay = await simulateNetworkDelay();
    logger.debug(`Mock API: search for "${query}" (${delay}ms)`);
    
    // Filter results if query is specific
    if (query && query.length > 0) {
      const filteredResults = mockSearchResults.results.filter(result => 
        result.title.toLowerCase().includes(query.toLowerCase()) || 
        result.content.toLowerCase().includes(query.toLowerCase())
      );
      
      return {
        ...mockSearchResults,
        results: filteredResults,
        analytics: {
          ...mockSearchResults.analytics,
          execution_time_ms: delay,
          total_results: filteredResults.length
        }
      };
    }
    
    return mockSearchResults;
  },

  /**
   * Uploads a mock document
   * @param file - File to upload
   * @returns Mock upload result
   */
  upload: async (file: File) => {
    const delay = await simulateNetworkDelay(800, 1500);
    const id = `upload-${Date.now()}`;
    logger.debug(`Mock API: upload file "${file.name}" (${delay}ms)`);
    
    // Add to mock documents
    mockDocuments.set(id, {
      id,
      title: file.name,
      content: `Mock content for ${file.name}`,
      contentType: file.type || 'application/octet-stream',
      author: 'Current User',
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      wordCount: Math.floor(Math.random() * 2000) + 100,
      tags: [],
      vectorEmbedding: Array(384).fill(Math.random() * 0.5),
    });
    
    return {
      id,
      status: "completed",
      progress: 100,
      result: {
        title: file.name,
        word_count: mockDocuments.get(id)?.wordCount,
        language: "en",
        processing_time_ms: delay
      }
    };
  },

  /**
   * Gets mock processing status
   * @param id - Document ID
   * @returns Mock processing status
   */
  processingStatus: async (id: string) => {
    const delay = await simulateNetworkDelay(200, 400);
    logger.debug(`Mock API: processing status for "${id}" (${delay}ms)`);
    
    const doc = mockDocuments.get(id);
    if (!doc) {
      return {
        id,
        status: "error",
        progress: 0,
        error: "Document not found"
      };
    }
    
    return {
      id,
      status: "completed",
      progress: 100,
      result: {
        title: doc.title,
        content_type: doc.contentType,
        word_count: doc.wordCount,
        processing_time_ms: delay
      }
    };
  },
  
  /**
   * Gets mock document details
   * @param id - Document ID
   * @returns Mock document
   */
  getDocument: async (id: string) => {
    await simulateNetworkDelay();
    logger.debug(`Mock API: get document "${id}"`);
    
    const doc = mockDocuments.get(id);
    if (!doc) {
      throw new Error("Document not found");
    }
    
    return {
      id: doc.id,
      title: doc.title,
      contentType: doc.contentType,
      author: doc.author,
      createdAt: doc.createdAt,
      lastModified: doc.lastModified,
      wordCount: doc.wordCount,
      tags: doc.tags
    };
  },
  
  /**
   * Gets mock document content
   * @param id - Document ID
   * @returns Mock document content
   */
  getDocumentContent: async (id: string) => {
    await simulateNetworkDelay();
    logger.debug(`Mock API: get document content "${id}"`);
    
    const doc = mockDocuments.get(id);
    if (!doc) {
      throw new Error("Document not found");
    }
    
    return {
      id: doc.id,
      content: doc.content,
      contentType: doc.contentType
    };
  },
  
  /**
   * Gets mock document list
   * @returns Mock document list
   */
  getDocuments: async () => {
    await simulateNetworkDelay();
    logger.debug(`Mock API: get documents list`);
    
    return Array.from(mockDocuments.values()).map(doc => ({
      id: doc.id,
      title: doc.title,
      contentType: doc.contentType,
      author: doc.author,
      createdAt: doc.createdAt,
      wordCount: doc.wordCount
    }));
  },
  
  /**
   * Deletes a mock document
   * @param id - Document ID
   * @returns Success message
   */
  deleteDocument: async (id: string) => {
    await simulateNetworkDelay();
    logger.debug(`Mock API: delete document "${id}"`);
    
    if (!mockDocuments.has(id)) {
      throw new Error("Document not found");
    }
    
    mockDocuments.delete(id);
    return { success: true, message: "Document deleted" };
  },
  
  /**
   * Gets mock search suggestions
   * @param partialQuery - Partial query
   * @returns Mock suggestions
   */
  getSuggestions: async (partialQuery: string) => {
    await simulateNetworkDelay(100, 200);
    logger.debug(`Mock API: get suggestions for "${partialQuery}"`);
    
    if (!partialQuery) {
      return { suggestions: [] };
    }
    
    // Generate a few mock suggestions
    const suggestions = [
      `${partialQuery} search`,
      `${partialQuery} algorithm`,
      `${partialQuery} examples`,
      `how to ${partialQuery}`,
      `best ${partialQuery} methods`
    ];
    
    return { 
      suggestions: suggestions.slice(0, 3),
      time_ms: 42
    };
  }
};
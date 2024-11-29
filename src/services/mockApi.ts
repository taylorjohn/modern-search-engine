// src/services/mockApi.ts

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

export const mockApi = {
  search: async (query: string) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockSearchResults;
  },

  upload: async (file: File) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      id: "upload-1",
      status: "completed",
      progress: 100,
      result: {
        title: file.name,
        word_count: 1500,
        language: "en",
        vector_embedding: Array(384).fill(0.1),
        processing_time_ms: 850
      }
    };
  },

  processingStatus: async (id: string) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      id,
      status: "completed",
      progress: 100,
      result: {
        title: "Uploaded Document",
        content_type: "pdf",
        word_count: 1500,
        processing_time_ms: 850
      }
    };
  }
};
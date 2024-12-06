// src/mockData.ts
export const mockDocuments = [
    {
      id: "1",
      title: "Introduction to Vector Search Engines",
      content: "Vector search is a modern approach to information retrieval that uses numerical representations of text (embeddings) to find similar documents.",
      author: "John Doe",
      tags: ["search", "vectors", "machine-learning"],
      scores: {
        text_score: 0.85,
        vector_score: 0.92,
        final_score: 0.89
      }
    },
    {
      id: "2",
      title: "Understanding Semantic Search",
      content: "Semantic search goes beyond traditional keyword matching by understanding the meaning and context of search queries.",
      author: "Jane Smith",
      tags: ["semantic", "search", "nlp"],
      scores: {
        text_score: 0.78,
        vector_score: 0.88,
        final_score: 0.84
      }
    }
  ];
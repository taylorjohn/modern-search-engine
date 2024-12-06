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
  {
      id: "2",
      title: "Exploring Neural Networks for NLP",
      content: "Neural networks have revolutionized natural language processing by enabling tasks like sentiment analysis, text generation, and machine translation...",
      author: "Alice Smith",
      tags: ["machine-learning", "NLP", "deep-learning"],
      highlights: [],
      matches: [],
      scores: {
        text_score: 0.83,
        vector_score: 0.90,
        final_score: 0.87,
        field_scores: [
          { field: "title", score: 0.88, weight: 1.5 },
          { field: "content", score: 0.85, weight: 1.0 }
        ]
      },
      metadata: {
        source_type: "technical_article",
        word_count: 1700,
        created_at: "2024-02-15T09:45:00Z",
        last_modified: "2024-02-18T12:00:00Z"
      }
    },
    {
      id: "3",
      title: "A Comprehensive Guide to Kubernetes",
      content: "Kubernetes is an open-source container orchestration platform designed to automate deployment, scaling, and operations of application containers...",
      author: "Chris Johnson",
      tags: ["DevOps", "Kubernetes", "cloud-computing"],
      highlights: [],
      matches: [],
      scores: {
        text_score: 0.87,
        vector_score: 0.93,
        final_score: 0.90,
        field_scores: [
          { field: "title", score: 0.92, weight: 1.5 },
          { field: "content", score: 0.88, weight: 1.0 }
        ]
      },
      metadata: {
        source_type: "blog_post",
        word_count: 2000,
        created_at: "2024-01-20T14:30:00Z",
        last_modified: "2024-01-25T17:45:00Z"
      }
    },
    {
      id: "4",
      title: "Introduction to Quantum Computing",
      content: "Quantum computing harnesses the principles of quantum mechanics to process information in ways that classical computers cannot...",
      author: "Emily Davis",
      tags: ["quantum-computing", "emerging-tech"],
      highlights: [],
      matches: [],
      scores: {
        text_score: 0.80,
        vector_score: 0.88,
        final_score: 0.84,
        field_scores: [
          { field: "title", score: 0.85, weight: 1.5 },
          { field: "content", score: 0.81, weight: 1.0 }
        ]
      },
      metadata: {
        source_type: "research_paper",
        word_count: 3000,
        created_at: "2024-02-10T10:00:00Z",
        last_modified: "2024-02-14T12:30:00Z"
      }
    },
    {
      id: "5",
      title: "Building REST APIs with Node.js",
      content: "REST APIs are essential for web applications, and Node.js provides a lightweight, efficient environment for building them...",
      author: "Michael Brown",
      tags: ["Node.js", "REST APIs", "web-development"],
      highlights: [],
      matches: [],
      scores: {
        text_score: 0.84,
        vector_score: 0.91,
        final_score: 0.88,
        field_scores: [
          { field: "title", score: 0.89, weight: 1.5 },
          { field: "content", score: 0.83, weight: 1.0 }
        ]
      },
      metadata: {
        source_type: "tutorial",
        word_count: 1500,
        created_at: "2024-03-01T11:00:00Z",
        last_modified: "2024-03-03T14:00:00Z"
      }
    },
    {
      id: "6",
      title: "Understanding Blockchain Technology",
      content: "Blockchain provides a decentralized ledger that ensures transparency and security for various applications, including cryptocurrency and supply chain...",
      author: "Rachel Green",
      tags: ["blockchain", "cryptocurrency", "decentralization"],
      highlights: [],
      matches: [],
      scores: {
        text_score: 0.86,
        vector_score: 0.89,
        final_score: 0.87,
        field_scores: [
          { field: "title", score: 0.90, weight: 1.5 },
          { field: "content", score: 0.84, weight: 1.0 }
        ]
      },
      metadata: {
        source_type: "technical_article",
        word_count: 1800,
        created_at: "2024-01-10T08:30:00Z",
        last_modified: "2024-01-12T10:45:00Z"
      }
    }
  ];
  
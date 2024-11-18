import React from 'react';
import { Database, Hash, Zap, Search, Tag } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

// Sample data representing vector search results
const sampleData = {
  query: {
    original: "machine learning frameworks",
    embedding_model: "all-MiniLM-L6-v2",
  },
  results: [
    {
      id: "doc1",
      title: "Introduction to PyTorch",
      content: "PyTorch is a popular machine learning framework that provides excellent support for deep learning and neural networks...",
      author: "Sarah Chen",
      tags: ["machine learning", "pytorch", "deep learning"],
      scores: {
        vector: 0.92,
        keyword: 0.85,
        final: 0.89
      },
      vector_matches: [
        "deep learning frameworks",
        "neural network libraries",
        "machine learning tools"
      ]
    },
    {
      id: "doc2",
      title: "TensorFlow vs PyTorch Comparison",
      content: "Comparing the two most popular machine learning frameworks: TensorFlow and PyTorch. Analysis of features, performance, and use cases...",
      author: "Michael Rodriguez",
      tags: ["tensorflow", "pytorch", "comparison"],
      scores: {
        vector: 0.88,
        keyword: 0.90,
        final: 0.87
      },
      vector_matches: [
        "ml framework comparison",
        "deep learning tools",
        "neural network platforms"
      ]
    },
    {
      id: "doc3",
      title: "Getting Started with TensorFlow",
      content: "Learn how to build and train machine learning models using TensorFlow, Google's popular deep learning framework...",
      author: "James Wilson",
      tags: ["tensorflow", "tutorial", "machine learning"],
      scores: {
        vector: 0.85,
        keyword: 0.82,
        final: 0.84
      },
      vector_matches: [
        "ml frameworks tutorial",
        "tensorflow basics",
        "deep learning introduction"
      ]
    }
  ],
  analytics: {
    executionTimeMs: 125,
    totalResults: 3,
    searchType: "hybrid",
    weights: {
      vector: 0.6,
      keyword: 0.4
    },
    vectorStats: {
      dimension: 384,
      similarity_metric: "cosine",
      embedding_model: "all-MiniLM-L6-v2"
    }
  }
};

const ScoreBar = ({ score, label, color = "blue" }) => (
  <div className="flex items-center gap-2 mb-2">
    <div className="w-24 text-sm">{label}</div>
    <div className="flex-1 bg-gray-200 rounded-full h-2">
      <div 
        className={`bg-${color}-500 rounded-full h-2 transition-all duration-500`} 
        style={{ width: `${score * 100}%` }}
      />
    </div>
    <div className="w-16 text-sm text-right">{(score * 100).toFixed(1)}%</div>
  </div>
);

const VectorMatchChip = ({ match }) => (
  <div className="inline-flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-2 mb-2">
    <Tag className="w-3 h-3 mr-1" />
    {match}
  </div>
);

const SearchResult = ({ result }) => (
  <Card className="mb-4">
    <CardContent className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-semibold mb-2">{result.title}</h3>
          <div className="text-sm text-gray-600 mb-2">
            by {result.author} • {result.tags.join(", ")}
          </div>
        </div>
        <div className="text-2xl font-bold text-blue-500">
          {(result.scores.final * 100).toFixed(0)}
        </div>
      </div>

      <div className="mt-4">
        <div className="font-medium mb-2 flex items-center gap-2">
          <Hash className="w-4 h-4" />
          Similarity Scores
        </div>
        <div className="space-y-2">
          <ScoreBar 
            score={result.scores.vector} 
            label="Vector" 
            color="purple" 
          />
          <ScoreBar 
            score={result.scores.keyword} 
            label="Keyword" 
            color="blue" 
          />
          <ScoreBar 
            score={result.scores.final} 
            label="Combined" 
            color="green" 
          />
        </div>
      </div>

      <div className="mt-4">
        <div className="font-medium mb-2 flex items-center gap-2">
          <Database className="w-4 h-4" />
          Content
        </div>
        <div className="text-sm text-gray-600">
          {result.content}
        </div>
      </div>

      <div className="mt-4">
        <div className="font-medium mb-2 flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Vector Matches
        </div>
        <div className="flex flex-wrap">
          {result.vector_matches.map((match, index) => (
            <VectorMatchChip key={index} match={match} />
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
);

const SearchAnalytics = ({ analytics }) => (
  <Card className="mb-6">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Database className="w-5 h-5" />
        Vector Search Analytics
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <div className="text-sm text-gray-600">Search Type</div>
          <div className="text-xl font-semibold capitalize">{analytics.searchType}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Response Time</div>
          <div className="text-xl font-semibold">{analytics.executionTimeMs}ms</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Vector Weight</div>
          <div className="text-xl font-semibold">{analytics.weights.vector * 100}%</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Keyword Weight</div>
          <div className="text-xl font-semibold">{analytics.weights.keyword * 100}%</div>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-sm font-medium mb-2">Vector Details</div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-gray-600">Embedding Model:</div>
          <div>{analytics.vectorStats.embedding_model}</div>
          <div className="text-gray-600">Vector Dimension:</div>
          <div>{analytics.vectorStats.dimension}</div>
          <div className="text-gray-600">Similarity Metric:</div>
          <div className="capitalize">{analytics.vectorStats.similarity_metric}</div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const SearchQuery = ({ query }) => (
  <Card className="mb-4">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Search className="w-5 h-5" />
        Search Query
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 gap-2">
        <div className="text-sm text-gray-600">Original Query:</div>
        <div className="font-medium">{query.original}</div>
        <div className="text-sm text-gray-600">Embedding Model:</div>
        <div className="font-medium">{query.embedding_model}</div>
      </div>
    </CardContent>
  </Card>
);

const VectorSearchDemo = () => {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <SearchQuery query={sampleData.query} />
      <SearchAnalytics analytics={sampleData.analytics} />
      <div className="space-y-4">
        {sampleData.results.map((result, index) => (
          <SearchResult key={result.id} result={result} />
        ))}
      </div>
    </div>
  );
};

export default VectorSearchDemo;

import React, { useState } from 'react';
import { Search, Info, ArrowRight, Star, Tag, Award, Zap, BarChart3 } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

const SearchDemo = () => {
  // Sample search results data
  const searchData = {
    query: {
      original: "\"rust programming\" author:\"John Doe\" +advanced",
      parsed: {
        tokens: [
          { type: "Phrase", value: "rust programming" },
          { type: "Field", field: "author", value: "John Doe" },
          { type: "Term", required: true, value: "advanced" }
        ]
      }
    },
    results: [
      {
        title: "Advanced Rust Programming Techniques",
        content: "Learn about advanced Rust programming concepts including ownership, borrowing, and lifetimes...",
        author: "John Doe",
        scores: {
          exactMatch: 0.95,
          semantic: 0.88,
          fieldMatch: 1.0,
          fuzzy: 0.0,
          final: 0.94
        },
        highlights: [
          "Learn about <mark>advanced</mark> <mark>Rust</mark> <mark>programming</mark> concepts...",
          "Understanding memory management in <mark>Rust</mark>..."
        ],
        tags: ["rust", "programming", "advanced"],
        metadata: {
          datePublished: "2024-03-15",
          readTime: "8 min"
        }
      },
      {
        title: "Getting Started with Rust",
        content: "A beginner's guide to Rust programming language fundamentals...",
        author: "John Doe",
        scores: {
          exactMatch: 0.75,
          semantic: 0.82,
          fieldMatch: 1.0,
          fuzzy: 0.0,
          final: 0.86
        },
        highlights: [
          "Guide to <mark>Rust</mark> <mark>programming</mark> language...",
          "Basic concepts of <mark>Rust</mark>..."
        ],
        tags: ["rust", "programming", "beginner"],
        metadata: {
          datePublished: "2024-02-28",
          readTime: "5 min"
        }
      }
    ],
    analytics: {
      executionTimeMs: 45,
      totalResults: 2,
      maxScore: 0.94,
      queryAnalysis: {
        complexity: "high",
        fields: ["content", "author"],
        operators: ["phrase", "field", "required"]
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
      <div className="w-12 text-sm text-right">{(score * 100).toFixed(0)}%</div>
    </div>
  );

  const QueryAnalysis = ({ query }) => (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Search className="w-5 h-5" />
          Query Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="font-medium mb-2">Original Query</div>
            <div className="bg-gray-100 p-2 rounded font-mono text-sm">
              {query.original}
            </div>
          </div>
          <div>
            <div className="font-medium mb-2">Parsed Components</div>
            <div className="space-y-2">
              {query.parsed.tokens.map((token, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <ArrowRight className="w-4 h-4" />
                  <span className="font-medium">{token.type}:</span>
                  {token.field && <span className="text-blue-500">{token.field}:</span>}
                  <span>{token.value}</span>
                  {token.required && <span className="text-green-500">(required)</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const SearchResults = ({ results }) => (
    <div className="space-y-4">
      {results.map((result, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-2">{result.title}</h3>
                <div className="text-sm text-gray-600 mb-2">
                  by {result.author} • {result.metadata.readTime} read • {result.metadata.datePublished}
                </div>
              </div>
              <div className="text-2xl font-bold text-blue-500">
                {(result.scores.final * 100).toFixed(0)}
              </div>
            </div>

            <div className="mt-4">
              <div className="font-medium mb-2">Score Breakdown</div>
              <ScoreBar score={result.scores.exactMatch} label="Exact Match" color="blue" />
              <ScoreBar score={result.scores.semantic} label="Semantic" color="green" />
              <ScoreBar score={result.scores.fieldMatch} label="Field Match" color="purple" />
              <ScoreBar score={result.scores.fuzzy} label="Fuzzy Match" color="orange" />
            </div>

            <div className="mt-4">
              <div className="font-medium mb-2">Highlighted Matches</div>
              {result.highlights.map((highlight, i) => (
                <div 
                  key={i}
                  className="text-sm text-gray-600 mb-1"
                  dangerouslySetInnerHTML={{ __html: highlight }}
                />
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              {result.tags.map((tag, i) => (
                <span key={i} className="px-2 py-1 bg-gray-100 rounded-full text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const SearchAnalytics = ({ analytics }) => (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Search Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600">Execution Time</div>
            <div className="text-xl font-semibold">{analytics.executionTimeMs}ms</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Total Results</div>
            <div className="text-xl font-semibold">{analytics.totalResults}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Max Score</div>
            <div className="text-xl font-semibold">{(analytics.maxScore * 100).toFixed(0)}%</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Query Complexity</div>
            <div className="text-xl font-semibold capitalize">{analytics.queryAnalysis.complexity}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <QueryAnalysis query={searchData.query} />
      <SearchAnalytics analytics={searchData.analytics} />
      <SearchResults results={searchData.results} />
    </div>
  );
};

export default SearchDemo;

// src/components/search/SearchResultList.tsx
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ScoreBar } from '@/components/ui';

interface SearchResult {
  id: string;
  title: string;
  content: string;
  documentType: string;
  scores: {
    vectorScore: number;
    finalScore: number;
  };
  metadata: {
    created: number;
    wordCount: number;
    type: string;
  };
}

interface SearchResultListProps {
  results: SearchResult[];
  isLoading: boolean;
  query: string;
}

export default function SearchResultList({ results, isLoading, query }: SearchResultListProps) {
  const [expandedItems, setExpandedItems] = useState(new Set<string>());

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (results.length === 0 && query && !isLoading) {
    return (
      <Card className="mt-8">
        <CardContent className="p-6 text-center text-gray-500">
          No documents found. Try uploading some documents first.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-8 space-y-4">
      {results.map((result) => (
        <Card key={result.id}>
          <CardContent className="p-6">
            <div className="flex justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                {result.title}
                <span className="text-sm text-gray-500">
                  ({result.documentType})
                </span>
              </h2>
              <span className="text-2xl font-bold text-blue-600">
                {(result.scores.finalScore * 100).toFixed(0)}%
              </span>
            </div>
            <p className="mt-2 text-gray-600">{result.content}</p>

            <button
              onClick={() => toggleExpand(result.id)}
              className="mt-4 text-sm text-blue-600 flex items-center gap-1 hover:text-blue-800"
              data-testid="toggle-details"
            >
              {expandedItems.has(result.id) ? (
                <>Hide Details <ChevronUp className="w-4 h-4" /></>
              ) : (
                <>Show Details <ChevronDown className="w-4 h-4" /></>
              )}
            </button>

            {expandedItems.has(result.id) && (
              <div className="mt-4 pt-4 border-t space-y-4 animate-fade-in">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Score Breakdown</h3>
                  <ScoreBar label="Vector Score" score={result.scores.vectorScore} color="bg-purple-500" />
                  <ScoreBar label="Final Score" score={result.scores.finalScore} color="bg-blue-600" />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Created:</span>
                    <span className="ml-2">{new Date(result.metadata.created).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Word Count:</span>
                    <span className="ml-2">{result.metadata.wordCount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Type:</span>
                    <span className="ml-2">{result.metadata.type}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
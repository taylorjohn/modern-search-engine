import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface SearchResult {
  id: string;
  title: string;
  content: string;
  scores: {
    textScore: number;
    vectorScore: number;
    finalScore: number;
  };
  metadata: {
    author: string;
    created: string;
    wordCount: number;
    type: string;
  };
}

interface SearchResultsProps {
  results: SearchResult[];
  expandedItems: Set<string>;
  onToggleExpand: (id: string) => void;
}

function ScoreBar({ label, score, color = "bg-blue-600" }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-24 text-sm text-gray-600">{label}:</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className={`${color} h-full transition-all duration-1000 ease-out`}
          style={{ 
            width: `${score * 100}%`,
            transform: 'translateX(-100%)',
            animation: 'slideRight 1s forwards'
          }}
        />
      </div>
      <span className="w-16 text-sm text-gray-600 text-right">
        {(score * 100).toFixed(1)}%
      </span>
    </div>
  );
}

export default function SearchResults({ results, expandedItems, onToggleExpand }: SearchResultsProps) {
  return (
    <div className="mt-8 space-y-4">
      {results.map((result) => (
        <Card key={result.id} className="hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex justify-between">
              <h2 className="text-lg font-semibold">{result.title}</h2>
              <span className="text-2xl font-bold text-blue-600">
                {(result.scores.finalScore * 100).toFixed(0)}%
              </span>
            </div>
            <p className="mt-2 text-gray-600">{result.content}</p>
            
            <button
              onClick={() => onToggleExpand(result.id)}
              className="mt-4 text-sm text-blue-600 flex items-center gap-1 hover:text-blue-800"
            >
              {expandedItems.has(result.id) ? (
                <>Hide Details <ChevronUp className="w-4 w-4" /></>
              ) : (
                <>Show Details <ChevronDown className="w-4 w-4" /></>
              )}
            </button>

            {expandedItems.has(result.id) && (
              <div className="mt-4 pt-4 border-t space-y-4 animate-fade-in">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Score Breakdown</h3>
                  <ScoreBar label="Text Match" score={result.scores.textScore} color="bg-green-500" />
                  <ScoreBar label="Vector Score" score={result.scores.vectorScore} color="bg-purple-500" />
                  <ScoreBar label="Final Score" score={result.scores.finalScore} color="bg-blue-600" />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Author:</span>
                    <span className="ml-2">{result.metadata.author}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Created:</span>
                    <span className="ml-2">{new Date(result.metadata.created).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Word Count:</span>
                    <span className="ml-2">{result.metadata.wordCount}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Type:</span>
                    <span className="ml-2 capitalize">{result.metadata.type}</span>
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
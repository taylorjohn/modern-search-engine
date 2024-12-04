// src/components/search/SearchResults.tsx
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScoreBar } from './ScoreBar';
import { SearchResult as SearchResultType } from '@/types/search';

interface SearchResultsProps {
  results: SearchResultType[];
}

export const SearchResults: React.FC<SearchResultsProps> = ({ results }) => {
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedResults);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedResults(newExpanded);
  };

  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-gray-500">
          No results found
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {results.map((result) => (
        <Card key={result.id}>
          <CardHeader className="pb-2">
            <div className="flex justify-between">
              <CardTitle className="text-xl">{result.title}</CardTitle>
              <div className="text-2xl font-bold text-blue-600">
                {(result.scores.final_score * 100).toFixed(0)}%
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Highlights */}
            <div className="space-y-2 mb-4">
              {result.highlights.map((highlight, index) => (
                <p
                  key={index}
                  className="text-sm text-gray-700"
                  dangerouslySetInnerHTML={{ __html: highlight }}
                />
              ))}
            </div>

            {/* Tags */}
            {result.metadata.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {result.metadata.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 rounded-full"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Score Breakdown */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <ScoreBar
                  label="Text Match"
                  score={result.scores.text_score}
                  color="blue"
                />
                <ScoreBar
                  label="Semantic Match"
                  score={result.scores.vector_score}
                  color="green"
                />
              </div>

              {expandedResults.has(result.id) && (
                <div className="pt-4 border-t space-y-2 text-sm text-gray-600">
                  <div>Title match: {(result.scores.title_score * 100).toFixed(1)}%</div>
                  <div>Content match: {(result.scores.content_score * 100).toFixed(1)}%</div>
                  <div>Words: {result.metadata.word_count}</div>
                  <div>Language: {result.metadata.language}</div>
                  <div>Updated: {new Date(result.metadata.updated_at).toLocaleString()}</div>
                </div>
              )}

              <button
                onClick={() => toggleExpand(result.id)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {expandedResults.has(result.id) ? (
                  <span className="flex items-center gap-1">
                    <ChevronUp className="w-4 h-4" /> Show less
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <ChevronDown className="w-4 h-4" /> Show more details
                  </span>
                )}
              </button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
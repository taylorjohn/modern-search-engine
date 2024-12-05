// src/components/search/SearchResults.tsx
import React, { useState } from 'react';
import { FileText, Tag, Star, ChevronDown, ChevronUp, BarChart2, Book, Hash } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { SearchResult } from '../../types';

interface Props {
  results: SearchResult[];
}

const SearchResults: React.FC<Props> = ({ results }) => {
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

  const ScoreBar = ({ score, label, color = "bg-blue-600" }: { score: number; label: string; color?: string }) => (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-24 text-gray-600">{label}:</span>
      <div className="flex-1 bg-gray-200 rounded-full h-2">
        <div
          className={`${color} rounded-full h-2 transition-all duration-300`}
          style={{ width: `${score * 100}%` }}
        />
      </div>
      <span className="w-16 text-right">
        {(score * 100).toFixed(1)}%
      </span>
    </div>
  );

  return (
    <div className="space-y-4">
      {results.map((result) => (
        <Card key={result.id} className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-gray-500" />
                  {result.title}
                </CardTitle>
                {result.author && (
                  <div className="text-sm text-gray-500 mt-1">
                    by {result.author}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end">
                <div className="text-3xl font-bold text-blue-600">
                  {(result.scores.final_score * 100).toFixed(0)}
                </div>
                <div className="text-xs text-gray-500">
                  relevance score
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                {result.highlights.map((highlight, index) => (
                  <p
                    key={index}
                    className="mb-1"
                    dangerouslySetInnerHTML={{ __html: highlight }}
                  />
                ))}
              </div>

              {result.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {result.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100"
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <button
                onClick={() => toggleExpand(result.id)}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
              >
                {expandedResults.has(result.id) ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Hide Details
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Show Scoring Details
                  </>
                )}
              </button>

              {expandedResults.has(result.id) && (
                <div className="mt-4 space-y-6 pt-4 border-t">
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <BarChart2 className="h-4 w-4" />
                      Score Breakdown
                    </h4>
                    <ScoreBar 
                      score={result.scores.vector_score} 
                      label="Vector Score" 
                      color="bg-purple-600"
                    />
                    <ScoreBar 
                      score={result.scores.text_score} 
                      label="Text Score"
                      color="bg-green-600" 
                    />
                    <ScoreBar 
                      score={result.scores.final_score} 
                      label="Final Score"
                      color="bg-blue-600"
                    />
                  </div>

                  {result.scores.field_scores.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        Field Scores
                      </h4>
                      {result.scores.field_scores.map((fieldScore, index) => (
                        <ScoreBar
                          key={index}
                          score={fieldScore.score}
                          label={fieldScore.field}
                          color="bg-indigo-600"
                        />
                      ))}
                    </div>
                  )}

                  {result.matches.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Book className="h-4 w-4" />
                        Term Matches
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {result.matches.map((match, index) => (
                          <div 
                            key={index}
                            className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm"
                          >
                            <span className="text-gray-600">{match.term}</span>
                            <span className="font-medium">
                              {match.count}x in {match.field}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div className="text-gray-600">Source Type:</div>
                    <div>{result.metadata.source_type}</div>
                    
                    <div className="text-gray-600">Word Count:</div>
                    <div>{result.metadata.word_count.toLocaleString()}</div>
                    
                    <div className="text-gray-600">Created:</div>
                    <div>{new Date(result.metadata.created_at).toLocaleString()}</div>
                    
                    <div className="text-gray-600">Modified:</div>
                    <div>
                      {new Date(result.metadata.last_modified).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SearchResults;

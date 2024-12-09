import React, { useState } from 'react';
import { FileText, ChevronDown, ChevronUp, BarChart2, Tag } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface SearchResult {
  id: string;
  title: string;
  content: string;
  scores: {
    text_score: number;
    vector_score: number;
    final_score: number;
  };
  metadata: {
    source_type: string;
    author?: string;
    created_at: string;
    word_count: number;
    tags?: string[];
  };
  highlights?: string[];
}

interface ScoreBarProps {
  score: number;
  label: string;
  color?: string;
  delay?: number;
}

const ScoreBar = ({ score, label, color = "bg-blue-600", delay = 0 }: ScoreBarProps) => (
  <div 
    className="flex items-center gap-2 animate-slide-in-right"
    style={{ animationDelay: `${delay}ms` }}
  >
    <span className="w-24 text-sm text-gray-600">{label}:</span>
    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
      <div
        className={`${color} h-full transition-all duration-1000 ease-out`}
        style={{ 
          width: `${score * 100}%`,
          transform: 'translateX(-100%)',
          animation: 'slideRight 1s forwards',
          animationDelay: `${delay}ms`
        }}
      />
    </div>
    <span className="w-16 text-sm text-gray-600 text-right">
      {(score * 100).toFixed(1)}%
    </span>
  </div>
);

interface SearchResultsProps {
  results: SearchResult[];
}

export default function SearchResults({ results }: SearchResultsProps) {
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedResults(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-4">
      {results.map((result, index) => (
        <div
          key={result.id}
          className="animate-fade-in-up"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <Card className="transform hover:scale-[1.01] transition-all duration-200">
            <CardHeader className="pb-2">
              <div className="flex justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {result.title}
                </CardTitle>
                <div className="text-2xl font-bold text-blue-600">
                  {(result.scores.final_score * 100).toFixed(0)}%
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600 line-clamp-2">{result.content}</p>

                {result.metadata.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {result.metadata.tags.map((tag, index) => (
                      <span key={index} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-xs">
                        <Tag className="h-3 w-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => toggleExpand(result.id)}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  {expandedResults.has(result.id) ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      Hide Details
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Show Details
                    </>
                  )}
                </button>

                {expandedResults.has(result.id) && (
                  <div className="mt-4 pt-4 border-t space-y-6 animate-fade-in">
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <BarChart2 className="h-4 w-4" />
                        Score Breakdown
                      </h4>
                      <ScoreBar score={result.scores.text_score} label="Text Match" color="bg-green-500" delay={100} />
                      <ScoreBar score={result.scores.vector_score} label="Semantic" color="bg-purple-500" delay={200} />
                      <ScoreBar score={result.scores.final_score} label="Final Score" color="bg-blue-600" delay={300} />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm animate-fade-in" style={{ animationDelay: '400ms' }}>
                      <div>
                        <span className="text-gray-600">Source:</span>
                        <span className="ml-2">{result.metadata.source_type}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Words:</span>
                        <span className="ml-2">{result.metadata.word_count.toLocaleString()}</span>
                      </div>
                      {result.metadata.author && (
                        <div>
                          <span className="text-gray-600">Author:</span>
                          <span className="ml-2">{result.metadata.author}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-600">Created:</span>
                        <span className="ml-2">
                          {new Date(result.metadata.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {result.highlights?.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Matching Excerpts</h4>
                        {result.highlights.map((highlight, hIndex) => (
                          <p
                            key={hIndex}
                            className="text-sm text-gray-600 p-2 bg-yellow-50 rounded animate-fade-in-up"
                            style={{ animationDelay: `${500 + hIndex * 100}ms` }}
                            dangerouslySetInnerHTML={{ __html: highlight }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}




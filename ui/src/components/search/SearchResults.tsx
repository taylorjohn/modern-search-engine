import React, { useState } from 'react';
import { FileText, Tag, Star, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

interface SearchResult {
  id: string;
  title: string;
  content: string;
  author?: string;
  tags: string[];
  scores: {
    text_score: number;
    vector_score: number;
    final_score: number;
  };
  highlights: string[];
  metadata: {
    source_type: string;
    word_count: number;
    created_at: string;
    last_modified: string;
  };
}

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

  const ScoreBar = ({ score, label }: { score: number; label: string }) => (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-20">{label}:</span>
      <div className="flex-1 bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 rounded-full h-2"
          style={{ width: `${score * 100}%` }}
        />
      </div>
      <span className="w-12 text-right">
        {(score * 100).toFixed(0)}%
      </span>
    </div>
  );

  return (
    <div className="space-y-4">
      {results.map((result) => (
        <Card key={result.id}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {result.title}
                </CardTitle>
                {result.author && (
                  <div className="text-sm text-gray-500">
                    by {result.author}
                  </div>
                )}
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {(result.scores.final_score * 100).toFixed(0)}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Highlights */}
              <div>
                {result.highlights.map((highlight, index) => (
                  <p
                    key={index}
                    className="text-sm text-gray-600 mb-1"
                    dangerouslySetInnerHTML={{ __html: highlight }}
                  />
                ))}
              </div>

              {/* Tags */}
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

              {/* Expand/Collapse Button */}
              <button
                onClick={() => toggleExpand(result.id)}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
              >
                {expandedResults.has(result.id) ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Show More
                  </>
                )}
              </button>

              {/* Expanded Content */}
              {expandedResults.has(result.id) && (
                <div className="mt-4 space-y-4 pt-4 border-t">
                  {/* Scores */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Relevance Scores</h4>
                    <ScoreBar score={result.scores.text_score} label="Text" />
                    <ScoreBar score={result.scores.vector_score} label="Vector" />
                    <ScoreBar score={result.scores.final_score} label="Final" />
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-gray-500">Source Type:</div>
                    <div>{result.metadata.source_type}</div>
                    <div className="text-gray-500">Word Count:</div>
                    <div>{result.metadata.word_count}</div>
                    <div className="text-gray-500">Created:</div>
                    <div>{new Date(result.metadata.created_at).toLocaleString()}</div>
                    <div className="text-gray-500">Modified:</div>
                    <div>{new Date(result.metadata.last_modified).toLocaleString()}</div>
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
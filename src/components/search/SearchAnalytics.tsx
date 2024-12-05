import React from 'react';
import { BarChart2, Clock, Hash, Zap, Scale, Filter, Sparkles } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

interface SearchAnalytics {
  execution_time_ms: number;
  total_results: number;
  max_score: number;
  search_type: string;
  vector_query: boolean;
  field_weights: Record<string, number>;
  query_analysis: {
    original: string;
    expanded: string;
    tokens: string[];
    stopwords_removed: string[];
  };
  performance: {
    vector_time_ms: number;
    text_time_ms: number;
    total_time_ms: number;
    result_count: number;
  };
}

interface Props {
  analytics: SearchAnalytics;
}

const SearchAnalytics: React.FC<Props> = ({ analytics }) => {
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Execution Time
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.execution_time_ms}ms</div>
            <p className="text-xs text-muted-foreground">
              Total processing time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Results Found
            </CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.total_results}</div>
            <p className="text-xs text-muted-foreground">
              Matching documents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Top Score
            </CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(analytics.max_score * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Highest match relevance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Search Type
            </CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {analytics.vector_query ? 'Hybrid' : 'Text'}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.vector_query 
                ? 'Vector + Text Search' 
                : 'Text-only Search'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            Performance Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-500">Vector Search</div>
                <div className="text-lg font-semibold">
                  {analytics.performance.vector_time_ms}ms
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Text Search</div>
                <div className="text-lg font-semibold">
                  {analytics.performance.text_time_ms}ms
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Total Time</div>
                <div className="text-lg font-semibold">
                  {analytics.performance.total_time_ms}ms
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Results</div>
                <div className="text-lg font-semibold">
                  {analytics.performance.result_count}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Query Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Query Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500 mb-1">Original Query</div>
                <div className="text-sm bg-gray-50 p-2 rounded">
                  {analytics.query_analysis.original}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Expanded Query</div>
                <div className="text-sm bg-gray-50 p-2 rounded">
                  {analytics.query_analysis.expanded}
                </div>
              </div>
            </div>
            
            <div>
              <div className="text-sm text-gray-500 mb-2">Query Tokens</div>
              <div className="flex flex-wrap gap-2">
                {analytics.query_analysis.tokens.map((token, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded"
                  >
                    {token}
                  </span>
                ))}
              </div>
            </div>
            
            {analytics.query_analysis.stopwords_removed.length > 0 && (
              <div>
                <div className="text-sm text-gray-500 mb-2">Removed Stopwords</div>
                <div className="flex flex-wrap gap-2">
                  {analytics.query_analysis.stopwords_removed.map((word, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                    >
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Field Weights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Field Weights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(analytics.field_weights).map(([field, weight]) => (
              <div key={field}>
                <div className="text-sm font-medium mb-1 capitalize">
                  {field.replace('_', ' ')}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full">
                    <div
                      className="h-2 bg-blue-600 rounded-full"
                      style={{ width: `${weight * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">
                    {(weight * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SearchAnalytics;
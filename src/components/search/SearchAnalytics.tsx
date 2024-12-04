// src/components/search/SearchAnalytics.tsx
import React from 'react';
import { Clock, Hash, BarChart2, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SearchAnalytics {
  total_results: number;
  execution_time_ms: number;
  max_score: number;
  vector_search: boolean;
}

interface SearchAnalyticsProps {
  analytics: SearchAnalytics;
}

export const SearchAnalytics: React.FC<SearchAnalyticsProps> = ({ analytics }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Results</CardTitle>
          <Hash className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.total_results}</div>
          <p className="text-xs text-muted-foreground">Total matches found</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Time</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.execution_time_ms}ms</div>
          <p className="text-xs text-muted-foreground">Search execution time</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Max Score</CardTitle>
          <BarChart2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {(analytics.max_score * 100).toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">Highest match score</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vector Search</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {analytics.vector_search ? 'Enabled' : 'Disabled'}
          </div>
          <p className="text-xs text-muted-foreground">Semantic matching</p>
        </CardContent>
      </Card>
    </div>
  );
};
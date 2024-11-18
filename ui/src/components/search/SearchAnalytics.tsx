import React from 'react';
import { BarChart2, Clock, Hash, Zap } from 'lucide-react';
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
  field_weights?: Record<string, number>;
}

interface Props {
  analytics: SearchAnalytics;
}

const SearchAnalytics: React.FC<Props> = ({ analytics }) => {
  return (
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
            Query processing time
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Results
          </CardTitle>
          <Hash className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.total_results}</div>
          <p className="text-xs text-muted-foreground">
            Matching documents found
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Max Score
          </CardTitle>
          <BarChart2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {(analytics.max_score * 100).toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">
            Highest relevance score
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

      {analytics.field_weights && (
        <Card className="md:col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Field Weights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(analytics.field_weights).map(([field, weight]) => (
                <div key={field} className="flex flex-col">
                  <span className="text-sm font-medium capitalize">{field}</span>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className="bg-blue-600 rounded-full h-2"
                      style={{ width: `${weight * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 mt-1">
                    {(weight * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SearchAnalytics;
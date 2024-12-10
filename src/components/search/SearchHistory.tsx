import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';
import { History, TrendingUp } from 'lucide-react';

interface SearchHistoryItem {
  query: string;
  timestamp: string;
  results: number;
  executionTime: number;
  filters: {
    contentTypes: string[];
    authors: string[];
  };
}

interface Props {
  history: SearchHistoryItem[];
  onQuerySelect: (query: string) => void;
}

export default function SearchHistory({ history, onQuerySelect }: Props) {
  const timeData = history.map(item => ({
    timestamp: new Date(item.timestamp).toLocaleTimeString(),
    time: item.executionTime,
    results: item.results
  }));

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-4 w-4" />
          Search History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Recent Queries</h4>
            <div className="flex flex-wrap gap-2">
              {history.slice(-5).map((item, index) => (
                <button
                  key={index}
                  onClick={() => onQuerySelect(item.query)}
                  className="px-3 py-1 text-sm bg-gray-100 rounded-full hover:bg-gray-200 transition-colors flex items-center gap-2"
                >
                  <span>{item.query}</span>
                  <span className="text-xs text-gray-500">{item.results}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeData}>
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="time" 
                  stroke="#3b82f6" 
                  name="Execution Time (ms)" 
                />
                <Line 
                  type="monotone" 
                  dataKey="results" 
                  stroke="#10b981" 
                  name="Results" 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
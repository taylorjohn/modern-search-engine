import React from 'react';
import { History } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface SearchHistoryProps {
  history: { query: string; results: number; }[];
  onSelect: (query: string) => void;
}

export default function SearchHistory({ history, onSelect }: SearchHistoryProps) {
  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
          <History className="h-4 w-4" />
          Recent Searches
        </h3>
        <div className="flex flex-wrap gap-2">
          {history.map((item, index) => (
            <button
              key={index}
              onClick={() => onSelect(item.query)}
              className="px-3 py-1 text-sm bg-gray-100 rounded-full hover:bg-gray-200 transition-colors flex items-center gap-2 group"
            >
              <span>{item.query}</span>
              <span className="text-xs text-gray-500 group-hover:text-gray-700">({item.results})</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
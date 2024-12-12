import React from 'react';
import { Download, Trash2, Clock, FilterX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';
import { searchHistoryService } from '../../services/searchHistory';
import type { SearchHistoryItem } from '../../types/search';

interface Props {
  history: SearchHistoryItem[];
  onHistoryChange: (history: SearchHistoryItem[]) => void;
}

export default function SearchHistoryManager({ history, onHistoryChange }: Props) {
  const handleClearHistory = () => {
    searchHistoryService.clear();
    onHistoryChange([]);
  };

  const handleExportHistory = () => {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `search-history-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <Clock className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Search History</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportHistory}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClearHistory}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Clear
            </Button>
          </div>

          <div className="space-y-4">
            {history.map((item, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{item.query}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(item.timestamp).toLocaleString()}
                      </div>
                      <div className="text-sm mt-1">
                        {item.results} results · {item.executionTime}ms
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.filters.contentTypes.join(', ')}
                    </div>
                  </div>
                  {item.filters.authors.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {item.filters.authors.map((author, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-gray-100 rounded-full text-xs"
                        >
                          {author}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
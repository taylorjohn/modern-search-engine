// src/App.tsx
import React, { useState } from 'react';
import { Search, RefreshCcw, Filter } from 'lucide-react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Card, CardContent } from './components/ui/card';
import { mockDocuments, type SearchResult } from './mockData';

function App() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const searchResults = mockDocuments.filter(doc => 
      doc.title.toLowerCase().includes(query.toLowerCase()) ||
      doc.content.toLowerCase().includes(query.toLowerCase()) ||
      doc.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
    
    setResults(searchResults);
    setShowAnalytics(true);
    setIsLoading(false);
  };

  const handleReset = () => {
    setQuery('');
    setResults([]);
    setShowAnalytics(false);
  };

  const highlightText = (text: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={i} className="bg-yellow-100 rounded px-1">{part}</mark>
        : part
    );
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Search Engine v2</h1>
        <p className="text-gray-600">
          Enhanced search with vector similarity
        </p>
      </header>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Search className="h-4 w-4" />
          </div>
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documents..."
            className="pl-10 pr-4"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            disabled={isLoading}
          />
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={handleSearch}
          disabled={isLoading || !query}
        >
          <Filter className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={handleReset}
          disabled={isLoading || !query}
        >
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </div>

      {showAnalytics && results.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-500">Found</div>
                <div className="text-2xl font-semibold">{results.length} results</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Best Match</div>
                <div className="text-2xl font-semibold">
                  {Math.max(...results.map(r => r.scores.final_score * 100)).toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Search Type</div>
                <div className="text-2xl font-semibold">Hybrid</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

{results.length > 0 ? (
        <div className="space-y-4">
          {results.map((result) => (
            <Card key={result.id}>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-2">
                  {highlightText(result.title)}
                </h3>
                <p className="text-gray-600 mb-4">
                  {highlightText(result.content)}
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.tags.map((tag) => (
                    <span 
                      key={tag}
                      className="px-2 py-1 bg-gray-100 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-sm text-gray-500">
                  <div>
                    <div>Text Score: {(result.scores.text_score * 100).toFixed(1)}%</div>
                    <div>Vector Score: {(result.scores.vector_score * 100).toFixed(1)}%</div>
                  </div>
                  <div>
                    <div>Author: {result.author}</div>
                    <div>Type: Document</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            {isLoading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p>Searching...</p>
              </div>
            ) : query ? (
              'No results found'
            ) : (
              'Enter a search query to begin'
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default App;
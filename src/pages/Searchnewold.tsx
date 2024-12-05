import React, { useState, useCallback, useEffect } from 'react';
import { Search as SearchIcon, Sliders, Filter, RefreshCcw } from 'lucide-react';
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import SearchResults from '../components/search/SearchResults';
import SearchAnalytics from '../components/search/SearchAnalytics';
import SearchBar from '../components/search/SearchBar';
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface SearchFilters {
  author?: string;
  dateRange?: {
    from: Date | null;
    to: Date | null;
  };
  contentType?: string[];
  tags?: string[];
}

interface SearchOptions {
  useVector: boolean;
  boost: {
    title: number;
    content: number;
    tags: number;
  };
}

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [filters, setFilters] = useState<SearchFilters>({
    contentType: ['pdf', 'html', 'text'],
    tags: [],
  });
  const [options, setOptions] = useState<SearchOptions>({
    useVector: true,
    boost: {
      title: 1.5,
      content: 1.0,
      tags: 1.2,
    },
  });
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // Simulated API call - replace with your actual API endpoint
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          filters,
          options,
        }),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setResults(data.results);
      setAnalytics(data.analytics);
      
      // Update search history
      setSearchHistory(prev => [query, ...prev.slice(0, 9)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [query, filters, options]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim()) {
        handleSearch();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, handleSearch]);

  const resetSearch = () => {
    setQuery('');
    setResults([]);
    setAnalytics(null);
    setFilters({
      contentType: ['pdf', 'html', 'text'],
      tags: [],
    });
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Search Engine V2</h1>
        <p className="text-gray-600">
          Enhanced search with vector similarity and hybrid matching
        </p>
      </header>

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <SearchBar
            value={query}
            onChange={setQuery}
            onSearch={handleSearch}
            isLoading={isLoading}
          />
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Sliders className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Search Options</SheetTitle>
              <SheetDescription>
                Configure search settings and filters
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* Vector Search Toggle */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Search Type</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={options.useVector}
                    onChange={(e) => setOptions(prev => ({
                      ...prev,
                      useVector: e.target.checked,
                    }))}
                    className="rounded border-gray-300"
                  />
                  <span>Enable vector similarity search</span>
                </div>
              </div>

              {/* Content Type Filters */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Content Types</label>
                {['pdf', 'html', 'text'].map(type => (
                  <div key={type} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters.contentType?.includes(type)}
                      onChange={(e) => {
                        setFilters(prev => ({
                          ...prev,
                          contentType: e.target.checked
                            ? [...(prev.contentType || []), type]
                            : prev.contentType?.filter(t => t !== type) || [],
                        }));
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="capitalize">{type}</span>
                  </div>
                ))}
              </div>

              {/* Boost Settings */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Field Weights</label>
                {Object.entries(options.boost).map(([field, value]) => (
                  <div key={field} className="space-y-1">
                    <label className="text-sm capitalize">{field}</label>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={value}
                      onChange={(e) => setOptions(prev => ({
                        ...prev,
                        boost: {
                          ...prev.boost,
                          [field]: parseFloat(e.target.value),
                        },
                      }))}
                      className="w-full"
                    />
                    <span className="text-sm">{value.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <Button
          variant="outline"
          size="icon"
          onClick={resetSearch}
          disabled={isLoading}
        >
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Search History */}
      {searchHistory.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-2">Recent Searches</h3>
          <div className="flex flex-wrap gap-2">
            {searchHistory.map((term, index) => (
              <button
                key={index}
                onClick={() => setQuery(term)}
                className="px-3 py-1 text-sm bg-gray-100 rounded-full hover:bg-gray-200"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4 text-red-600">
            {error}
          </CardContent>
        </Card>
      )}

      {/* Analytics */}
      {analytics && (
        <div className="mb-6">
          <SearchAnalytics analytics={analytics} />
        </div>
      )}

      {/* Results */}
      {results.length > 0 ? (
        <SearchResults results={results} />
      ) : !isLoading && query && (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            No results found for "{query}"
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-4 border-t-blue-600 border-blue-200 rounded-full animate-spin mb-4" />
              <p className="text-gray-500">Searching...</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Search;
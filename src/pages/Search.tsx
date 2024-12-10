import React, { useState, useCallback, useEffect } from 'react';
import { Search as SearchIcon, RefreshCcw } from 'lucide-react';
import SearchResults from '../components/search/SearchResults';
import SearchBar from '../components/search/SearchBar';
import SearchAnalytics from '../components/search/SearchAnalytics';
import SearchFilters from '../components/search/SearchFilters';
import SearchHistory from '../components/search/SearchHistory';
import SearchHistoryManager from '../components/search/SearchHistoryManager';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { searchHistoryService } from '../services/searchHistory';
import type { SearchHistoryItem, SearchFilters, SearchAnalytics, SearchResult } from '../types/search';

interface SearchResponse {
  results: SearchResult[];
  analytics: SearchAnalytics;
}

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [analytics, setAnalytics] = useState<SearchAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({
    contentTypes: ['pdf', 'html', 'text'],
    dateRange: { from: null, to: null },
    authors: []
  });

  useEffect(() => {
    setSearchHistory(searchHistoryService.get());
  }, []);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          filters: {
            content_types: filters.contentTypes,
            date_range: {
              from: filters.dateRange.from?.toISOString(),
              to: filters.dateRange.to?.toISOString()
            },
            authors: filters.authors
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data: SearchResponse = await response.json();
      setResults(data.results);
      setAnalytics(data.analytics);

      const historyItem: SearchHistoryItem = {
        query,
        timestamp: new Date().toISOString(),
        results: data.results.length,
        executionTime: data.analytics.execution_time_ms,
        filters: {
          contentTypes: filters.contentTypes,
          authors: filters.authors
        }
      };

      const updatedHistory = searchHistoryService.add(historyItem);
      setSearchHistory(updatedHistory);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsLoading(false);
    }
  }, [query, filters]);

  const resetSearch = () => {
    setQuery('');
    setResults([]);
    setAnalytics(null);
    setFilters({
      contentTypes: ['pdf', 'html', 'text'],
      dateRange: { from: null, to: null },
      authors: []
    });
  };

  const handleQuerySelect = (selectedQuery: string) => {
    setQuery(selectedQuery);
    handleSearch();
  };

  const frequentQueries = searchHistoryService.getFrequentQueries();

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Modern Search Engine</h1>
        <p className="text-gray-600">Search with transparency and real-time insights</p>
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
        <SearchFilters filters={filters} onChange={setFilters} />
        <SearchHistoryManager 
          history={searchHistory}
          onHistoryChange={setSearchHistory}
        />
        <Button
          variant="outline"
          size="icon"
          onClick={resetSearch}
          disabled={isLoading}
        >
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </div>

      {frequentQueries.length > 0 && (
        <div className="mb-4">
          <div className="text-sm font-medium mb-2">Popular Searches:</div>
          <div className="flex flex-wrap gap-2">
            {frequentQueries.map(({ query, count }) => (
              <button
                key={query}
                onClick={() => handleQuerySelect(query)}
                className="px-3 py-1 text-sm bg-gray-100 rounded-full hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <span>{query}</span>
                <span className="text-xs text-gray-500">({count})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {searchHistory.length > 0 && (
        <SearchHistory
          history={searchHistory}
          onQuerySelect={handleQuerySelect}
        />
      )}

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4 text-red-600">
            {error}
          </CardContent>
        </Card>
      )}

      {analytics && (
        <div className="space-y-6 mb-6 animate-fade-in">
          <SearchAnalytics analytics={analytics} />
        </div>
      )}

      {results.length > 0 ? (
        <div className="animate-fade-in">
          <SearchResults results={results} />
        </div>
      ) : (
        query && !isLoading && (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              No results found for "{query}"
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}
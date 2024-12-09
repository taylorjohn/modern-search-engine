import React, { useState, useCallback } from 'react';
import { Search as SearchIcon, RefreshCcw } from 'lucide-react';
import SearchResults from '../components/search/SearchResults';
import SearchBar from '../components/search/SearchBar';
import SearchAnalytics from '../components/search/SearchAnalytics';
import SearchFilters from '../components/search/SearchFilters';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface SearchResult {
  id: string;
  title: string;
  content: string;
  scores: {
    text_score: number;
    vector_score: number;
    final_score: number;
  };
  metadata: {
    source_type: string;
    author?: string;
    created_at: string;
    word_count: number;
    tags?: string[];
  };
  highlights?: string[];
}

interface SearchFilters {
  contentTypes: string[];
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  authors: string[];
}

interface SearchAnalytics {
  execution_time_ms: number;
  total_results: number;
  max_score: number;
  vector_query: boolean;
  result_distribution: {
    content_type: string;
    count: number;
  }[];
  score_ranges: {
    range: string;
    count: number;
  }[];
  timing_breakdown: {
    phase: string;
    time_ms: number;
  }[];
}

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
  const [filters, setFilters] = useState<SearchFilters>({
    contentTypes: ['pdf', 'html', 'text'],
    dateRange: { from: null, to: null },
    authors: []
  });

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
        <Button
          variant="outline"
          size="icon"
          onClick={resetSearch}
          disabled={isLoading}
        >
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4 text-red-600">
            {error}
          </CardContent>
        </Card>
      )}

      {analytics && (
        <div className="space-y-6 mb-6">
          <SearchAnalytics analytics={analytics} />
        </div>
      )}

      {results.length > 0 ? (
        <SearchResults results={results} />
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
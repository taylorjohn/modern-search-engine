// src/pages/Search.tsx
import React, { useState, useCallback } from 'react';
import { SearchInput } from '@/components/search/SearchInput';
import { SearchResults } from '@/components/search/SearchResults';
import { SearchAnalytics } from '@/components/search/SearchAnalytics';
import { Card, CardContent } from '@/components/ui/card';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          options: {
            includeHighlights: true,
            includeScores: true,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setResults(data.results);
      setAnalytics(data.analytics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Search Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Search</h1>
        <p className="text-gray-500">
          Search with transparency - see exactly how results are matched and scored
        </p>
      </div>

      {/* Search Input */}
      <SearchInput
        value={query}
        onChange={setQuery}
        onSearch={handleSearch}
        isLoading={isLoading}
      />

      {/* Error Message */}
      {error && (
        <Card>
          <CardContent className="p-4 text-red-600">
            {error}
          </CardContent>
        </Card>
      )}

      {/* Search Analytics */}
      {analytics && <SearchAnalytics analytics={analytics} />}

      {/* Search Results */}
      {query && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            Results for "{query}"
          </h2>
          <SearchResults results={results} />
        </div>
      )}
    </div>
  );
}
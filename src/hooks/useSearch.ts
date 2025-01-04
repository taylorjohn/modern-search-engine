// src/hooks/useSearch.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import { searchService } from '../services/search';
import { searchHistoryService } from '../services/searchHistory';
import { cacheService } from '../services/cache';
import { logger } from '../services/logger';
import { useSearchPerformance } from './usePerformance';
import type { SearchResult, SearchFilters } from '../types/search';
import { debounce } from '../lib/utils';

interface UseSearchOptions {
  debounceMs?: number;
  useCache?: boolean;
  autoSearch?: boolean;
}

export function useSearch({
  debounceMs = 300,
  useCache = true,
  autoSearch = true
}: UseSearchOptions = {}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({
    contentTypes: [],
    dateRange: { from: null, to: null },
    authors: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [stats, setStats] = useState({
    totalResults: 0,
    executionTime: 0
  });

  const { startSearch, endSearch } = useSearchPerformance();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cancel previous search if any
  const cancelPreviousSearch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Perform search
  const executeSearch = useCallback(async (
    searchQuery: string,
    searchFilters: SearchFilters
  ) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setStats({ totalResults: 0, executionTime: 0 });
      return;
    }

    cancelPreviousSearch();
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      // Check cache first
      if (useCache) {
        const cachedResults = cacheService.getSearchResults(searchQuery, searchFilters);
        if (cachedResults) {
          setResults(cachedResults);
          return;
        }
      }

      startSearch(searchQuery);
      
      const { results: searchResults, total, executionTime } = await searchService.search(
        searchQuery,
        searchFilters,
        { signal: abortControllerRef.current.signal }
      );

      setResults(searchResults);
      setStats({ totalResults: total, executionTime });
      endSearch(total);

      // Cache results
      if (useCache) {
        cacheService.setSearchResults(searchQuery, searchFilters, searchResults);
      }

      // Update search history
      searchHistoryService.add(
        searchQuery,
        total,
        executionTime,
        searchFilters
      );
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err);
        logger.error('Search failed', { error: err, query: searchQuery });
      }
    } finally {
      setLoading(false);
    }
  }, [useCache, startSearch, endSearch]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query: string, filters: SearchFilters) => {
      executeSearch(query, filters);
    }, debounceMs),
    [executeSearch, debounceMs]
  );

  // Handle query changes
  const handleQueryChange = useCallback((newQuery: string) => {
    setQuery(newQuery);
    if (autoSearch) {
      debouncedSearch(newQuery, filters);
    }
  }, [filters, autoSearch, debouncedSearch]);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: SearchFilters) => {
    setFilters(newFilters);
    if (autoSearch && query) {
      debouncedSearch(query, newFilters);
    }
  }, [query, autoSearch, debouncedSearch]);

  // Manual search trigger
  const search = useCallback(() => {
    if (query) {
      executeSearch(query, filters);
    }
  }, [query, filters, executeSearch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelPreviousSearch();
    };
  }, [cancelPreviousSearch]);

  return {
    query,
    setQuery: handleQueryChange,
    // src/hooks/useSearch.ts (continued)
    results,
    filters,
    setFilters: handleFilterChange,
    loading,
    error,
    stats,
    search,
    clearResults: useCallback(() => {
      setResults([]);
      setStats({ totalResults: 0, executionTime: 0 });
    }, []),
    clearFilters: useCallback(() => {
      setFilters({
        contentTypes: [],
        dateRange: { from: null, to: null },
        authors: []
      });
    }, []),
    reset: useCallback(() => {
      setQuery('');
      setResults([]);
      setFilters({
        contentTypes: [],
        dateRange: { from: null, to: null },
        authors: []
      });
      setError(null);
      setStats({ totalResults: 0, executionTime: 0 });
    }, [])
  };
}

// Hook for search history management
export function useSearchHistory() {
  const [history, setHistory] = useState(() => searchHistoryService.get());

  const clearHistory = useCallback(() => {
    searchHistoryService.clear();
    setHistory([]);
  }, []);

  const removeFromHistory = useCallback((id: string) => {
    searchHistoryService.remove(id);
    setHistory(searchHistoryService.get());
  }, []);

  const getRecentSearches = useCallback((limit?: number) => {
    return searchHistoryService.getRecent(limit);
  }, []);

  const searchInHistory = useCallback((query: string) => {
    return searchHistoryService.search(query);
  }, []);

  const exportHistory = useCallback(() => {
    return searchHistoryService.export();
  }, []);

  const importHistory = useCallback((jsonString: string) => {
    const success = searchHistoryService.import(jsonString);
    if (success) {
      setHistory(searchHistoryService.get());
    }
    return success;
  }, []);

  return {
    history,
    clearHistory,
    removeFromHistory,
    getRecentSearches,
    searchInHistory,
    exportHistory,
    importHistory,
    stats: searchHistoryService.getStats()
  };
}

// Hook for search filters management
export function useSearchFilters() {
  const [filters, setFilters] = useState<SearchFilters>({
    contentTypes: [],
    dateRange: { from: null, to: null },
    authors: []
  });

  const addContentType = useCallback((type: string) => {
    setFilters(prev => ({
      ...prev,
      contentTypes: [...prev.contentTypes, type]
    }));
  }, []);

  const removeContentType = useCallback((type: string) => {
    setFilters(prev => ({
      ...prev,
      contentTypes: prev.contentTypes.filter(t => t !== type)
    }));
  }, []);

  const setDateRange = useCallback((from: Date | null, to: Date | null) => {
    setFilters(prev => ({
      ...prev,
      dateRange: { from, to }
    }));
  }, []);

  const addAuthor = useCallback((author: string) => {
    setFilters(prev => ({
      ...prev,
      authors: [...prev.authors, author]
    }));
  }, []);

  const removeAuthor = useCallback((author: string) => {
    setFilters(prev => ({
      ...prev,
      authors: prev.authors.filter(a => a !== author)
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      contentTypes: [],
      dateRange: { from: null, to: null },
      authors: []
    });
  }, []);

  return {
    filters,
    setFilters,
    addContentType,
    removeContentType,
    setDateRange,
    addAuthor,
    removeAuthor,
    clearFilters
  };
}

// Hook for managing search results
export function useSearchResults() {
  const [expandedItems, setExpandedItems] = useState(new Set<string>());
  const [selectedItems, setSelectedItems] = useState(new Set<string>());
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [sortField, setSortField] = useState<'score' | 'date' | 'relevance'>('score');

  const toggleExpanded = useCallback((id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleSelected = useCallback((id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const sortResults = useCallback((results: SearchResult[]) => {
    return [...results].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'score':
          comparison = b.scores.finalScore - a.scores.finalScore;
          break;
        case 'date':
          comparison = new Date(b.metadata.created).getTime() - 
                      new Date(a.metadata.created).getTime();
          break;
        case 'relevance':
          comparison = (b.scores.textScore + b.scores.vectorScore) - 
                      (a.scores.textScore + a.scores.vectorScore);
          break;
      }
      return sortOrder === 'asc' ? -comparison : comparison;
    });
  }, [sortField, sortOrder]);

  return {
    expandedItems,
    selectedItems,
    sortOrder,
    sortField,
    toggleExpanded,
    toggleSelected,
    setSortOrder,
    setSortField,
    sortResults,
    clearSelection: useCallback(() => setSelectedItems(new Set()), []),
    clearExpanded: useCallback(() => setExpandedItems(new Set()), [])
  };
}
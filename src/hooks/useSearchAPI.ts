// src/hooks/useSearchAPI.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import { api } from '@/services/api';
import { useError } from '@/contexts/ErrorContext';
import { useDebounce, useDebouncedCallback } from '@/hooks/useDebounce';
import type { SearchResult } from '@/types/search';

export interface SearchFilters {
  contentTypes?: string[];
  dateRange?: {
    from: Date | null;
    to: Date | null;
  };
  authors?: string[];
}

interface UseSearchAPIOptions {
  debounceTime?: number;
  autoSearch?: boolean;
  initialFilters?: SearchFilters;
}

/**
 * Custom hook for interacting with the search API
 * @param options - Configuration options
 * @returns Search state and functions
 */
export function useSearchAPI({
  debounceTime = 300,
  autoSearch = true,
  initialFilters = {}
}: UseSearchAPIOptions = {}) {
  // State
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [executionTime, setExecutionTime] = useState(0);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  
  // Context
  const { handleError } = useError();
  
  // Refs
  const searchRequestIdRef = useRef('search');
  const suggestionsRequestIdRef = useRef('suggestions');
  
  // Create a debounced version of the query for search
  const debouncedSearchQuery = useDebounce(query, debounceTime);
  
  // Create debounced functions
  const debouncedSearch = useDebouncedCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setTotalResults(0);
      setExecutionTime(0);
      return;
    }
    
    setIsSearching(true);
    
    try {
      // Use the search method from our API service
      const response = await api.search(searchQuery, filters);
      
      setResults(response.results || []);
      setTotalResults(response.analytics?.total_results || response.results?.length || 0);
      setExecutionTime(response.analytics?.execution_time_ms || 0);
    } catch (error) {
      handleError(error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, debounceTime);
  
  // Debounced suggestions fetch
  const debouncedFetchSuggestions = useDebouncedCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }
    
    setIsLoadingSuggestions(true);
    
    try {
      const result = await api.getSuggestions(searchQuery);
      setSuggestions(result.suggestions || []);
    } catch (error) {
      // Silently fail for suggestions
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, 150); // Faster debounce for suggestions
  
  // Effect to trigger search when debounced query changes
  useEffect(() => {
    if (autoSearch) {
      setDebouncedQuery(debouncedSearchQuery);
      debouncedSearch(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery, autoSearch, debouncedSearch]);
  
  // Effect to fetch suggestions when query changes
  useEffect(() => {
    if (query.trim().length >= 2) {
      debouncedFetchSuggestions(query);
    } else {
      setSuggestions([]);
    }
  }, [query, debouncedFetchSuggestions]);
  
  // Cancel any pending requests on unmount
  useEffect(() => {
    return () => {
      api.cancelRequest(searchRequestIdRef.current);
      api.cancelRequest(suggestionsRequestIdRef.current);
    };
  }, []);
  
  // Manually trigger search
  const search = useCallback(async () => {
    if (query.trim()) {
      setDebouncedQuery(query);
      debouncedSearch.cancel?.();
      debouncedSearch(query);
    }
  }, [query, debouncedSearch]);
  
  // Update filters and trigger search if needed
  const updateFilters = useCallback((newFilters: SearchFilters) => {
    setFilters(prev => {
      const updated = { ...prev, ...newFilters };
      
      // If we already have a query, trigger a search with the new filters
      if (debouncedQuery && autoSearch) {
        debouncedSearch(debouncedQuery);
      }
      
      return updated;
    });
  }, [debouncedQuery, autoSearch, debouncedSearch]);
  
  // Clear search
  const clearSearch = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    setResults([]);
    setTotalResults(0);
    setExecutionTime(0);
    setSuggestions([]);
  }, []);
  
  return {
    // State
    query,
    results,
    isSearching,
    totalResults,
    executionTime,
    filters,
    suggestions,
    isLoadingSuggestions,
    
    // Actions
    setQuery,
    search,
    updateFilters,
    clearSearch,
    
    // Derived values
    hasResults: results.length > 0,
    hasSuggestions: suggestions.length > 0
  };
}
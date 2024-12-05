// src/pages/Search.tsx
import React, { useCallback, useEffect } from 'react';
import { Sliders, RefreshCcw } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import SearchResults from '../components/search/SearchResults';
import SearchAnalytics from '../components/search/SearchAnalytics';
import SearchBar from '../components/search/SearchBar';
import { useSearch } from '../contexts/SearchContext';
import { SearchResponse } from '../types';

const Search = () => {
  const { state, dispatch } = useSearch();

  const handleSearch = useCallback(async () => {
    if (!state.query.trim()) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: state.query,
          filters: state.filters,
          options: state.options,
        }),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data: SearchResponse = await response.json();
      
      dispatch({ type: 'SET_RESULTS', payload: data.results });
      dispatch({ type: 'SET_ANALYTICS', payload: data.analytics });
      dispatch({ type: 'ADD_TO_HISTORY', payload: state.query });
      
    } catch (err) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: err instanceof Error ? err.message : 'An error occurred'
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.query, state.filters, state.options, dispatch]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (state.query.trim()) {
        handleSearch();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [state.query, handleSearch]);

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Rest of the component remains the same, but uses state/dispatch */}
      {/* ... */}
    </div>
  );
};

export default Search;
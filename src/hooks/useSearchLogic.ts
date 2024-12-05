// src/hooks/useSearchLogic.ts
import { useCallback, useRef, useEffect } from 'react';
import { useSearch } from '../contexts/SearchContext';

export const useSearchLogic = () => {
  const { state, dispatch } = useSearch();
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const executeSearch = useCallback(async () => {
    if (!state.query.trim()) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

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

      const data = await response.json();
      dispatch({ type: 'SET_RESULTS', payload: data.results });
      dispatch({ type: 'SET_ANALYTICS', payload: data.analytics });
      
      if (state.query.trim()) {
        dispatch({ type: 'ADD_TO_HISTORY', payload: state.query });
      }
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Search failed'
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.query, state.filters, state.options, dispatch]);

  const debouncedSearch = useCallback(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      executeSearch();
    }, 300);
  }, [executeSearch]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return {
    executeSearch,
    debouncedSearch,
  };
};

// src/hooks/useSearchLogic.ts
import { useCallback, useRef, useEffect } from 'react';
import { useSearch } from '../contexts/SearchContext';
import { performSearch } from '../api/search';
import { SearchRequest } from '../types';

export const useSearchLogic = () => {
  const { state, dispatch } = useSearch();
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const executeSearch = useCallback(async (request: SearchRequest) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const response = await performSearch(request);
      
      dispatch({ type: 'SET_RESULTS', payload: response.results });
      dispatch({ type: 'SET_ANALYTICS', payload: response.analytics });
      
      if (request.query.trim()) {
        dispatch({ type: 'ADD_TO_HISTORY', payload: request.query });
      }
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Search failed'
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [dispatch]);

  const debouncedSearch = useCallback((request: SearchRequest) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      executeSearch(request);
    }, 300);
  }, [executeSearch]);

  const handleSearch = useCallback(() => {
    if (!state.query.trim()) return;

    const request: SearchRequest = {
      query: state.query,
      filters: state.filters,
      options: state.options,
    };

    debouncedSearch(request);
  }, [state.query, state.filters, state.options, debouncedSearch]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return {
    handleSearch,
    executeSearch,
    debouncedSearch,
  };
};
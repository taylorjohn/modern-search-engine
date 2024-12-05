// src/contexts/SearchContext.tsx
import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { SearchResult, SearchAnalytics, SearchFilters, SearchOptions } from '../types';

interface SearchState {
  query: string;
  results: SearchResult[];
  isLoading: boolean;
  error: string | null;
  analytics: SearchAnalytics | null;
  filters: SearchFilters;
  options: SearchOptions;
  searchHistory: string[];
}

type SearchAction =
  | { type: 'SET_QUERY'; payload: string }
  | { type: 'SET_RESULTS'; payload: SearchResult[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ANALYTICS'; payload: SearchAnalytics | null }
  | { type: 'SET_FILTERS'; payload: SearchFilters }
  | { type: 'SET_OPTIONS'; payload: SearchOptions }
  | { type: 'ADD_TO_HISTORY'; payload: string }
  | { type: 'RESET_SEARCH' };

const initialState: SearchState = {
  query: '',
  results: [],
  isLoading: false,
  error: null,
  analytics: null,
  filters: {
    contentType: ['pdf', 'html', 'text'],
    tags: [],
  },
  options: {
    useVector: true,
    boost: {
      title: 1.5,
      content: 1.0,
      tags: 1.2,
    },
  },
  searchHistory: [],
};

const searchReducer = (state: SearchState, action: SearchAction): SearchState => {
  switch (action.type) {
    case 'SET_QUERY':
      return { ...state, query: action.payload };
    case 'SET_RESULTS':
      return { ...state, results: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_ANALYTICS':
      return { ...state, analytics: action.payload };
    case 'SET_FILTERS':
      return { ...state, filters: action.payload };
    case 'SET_OPTIONS':
      return { ...state, options: action.payload };
    case 'ADD_TO_HISTORY':
      return {
        ...state,
        searchHistory: [action.payload, ...state.searchHistory.slice(0, 9)],
      };
    case 'RESET_SEARCH':
      return {
        ...initialState,
        options: state.options, // Preserve options on reset
      };
    default:
      return state;
  }
};

const SearchContext = createContext<{
  state: SearchState;
  dispatch: React.Dispatch<SearchAction>;
} | null>(null);

export const SearchProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(searchReducer, initialState);

  return (
    <SearchContext.Provider value={{ state, dispatch }}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};
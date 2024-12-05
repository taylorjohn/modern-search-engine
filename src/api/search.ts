// src/api/search.ts
import { SearchRequest, SearchResponse } from '../types';

export const performSearch = async (request: SearchRequest): Promise<SearchResponse> => {
  const response = await fetch('/api/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error('Search request failed');
  }

  return response.json();
};

export const getSearchSuggestions = async (query: string): Promise<string[]> => {
  const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch suggestions');
  }

  return response.json();
};

export const getPopularSearches = async (): Promise<string[]> => {
  const response = await fetch('/api/search/popular');
  
  if (!response.ok) {
    throw new Error('Failed to fetch popular searches');
  }

  return response.json();
};
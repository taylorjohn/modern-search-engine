import { useState, useCallback, useEffect } from 'react';
import { Clock, Hash, BarChart2, Zap } from 'lucide-react';

export function useSearchLogic() {
  const [query, setQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState([
    { query: 'vector search', results: 5 },
    { query: 'embeddings', results: 3 },
    { query: 'semantic search', results: 7 }
  ]);
  const [results, setResults] = useState([
    {
      id: '1',
      title: 'Introduction to Vector Search',
      content: 'A comprehensive guide to understanding vector search and its applications in modern search engines...',
      scores: {
        textScore: 0.92,
        vectorScore: 0.88,
        finalScore: 0.95
      },
      metadata: {
        author: 'John Doe',
        created: '2024-01-15',
        wordCount: 1250,
        type: 'technical'
      }
    }
  ]);

  const stats = [
    { title: 'Time', value: '45ms', icon: Clock },
    { title: 'Results', value: results.length, icon: Hash },
    { title: 'Score', value: '92%', icon: BarChart2 },
    { title: 'Mode', value: 'Hybrid', icon: Zap }
  ];

  const debouncedSearch = useCallback(async (searchQuery: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setResults(data.results);
      
      setSearchHistory(prev => [
        { query: searchQuery, results: data.results.length },
        ...prev.filter(item => item.query !== searchQuery).slice(0, 4)
      ]);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setQuery(value);
    if (value.trim()) {
      debouncedSearch(value);
    }
  }, [debouncedSearch]);

  const handleHistorySelect = useCallback((selectedQuery: string) => {
    setQuery(selectedQuery);
    debouncedSearch(selectedQuery);
  }, [debouncedSearch]);

  const toggleExpand = useCallback((id: string) => {
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

  return {
    query,
    results,
    isLoading,
    searchHistory,
    stats,
    handleSearchChange,
    handleHistorySelect,
    expandedItems,
    toggleExpand,
  };
}
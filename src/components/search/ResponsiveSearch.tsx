// src/components/search/ResponsiveSearch.tsx
import React, { useRef, useState, useEffect } from 'react';
import { Search as SearchIcon, Clock, Hash, BarChart2, X, Filter, Keyboard } from 'lucide-react';
import { useSearchAPI } from '@/hooks/useSearchAPI';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { SearchBar } from '@/components/search';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MetricCard, Toast } from '@/components/ui';
import { SearchResultList } from '@/components/search';

const ResponsiveSearch: React.FC = () => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{from: string | null, to: string | null}>({
    from: null,
    to: null
  });
  
  // Use our custom search hook
  const {
    query,
    setQuery,
    results,
    isSearching,
    totalResults,
    executionTime,
    suggestions,
    isLoadingSuggestions,
    search,
    clearSearch,
    hasResults,
    error,
    updateFilters
  } = useSearchAPI({
    debounceTime: 300,
    autoSearch: true
  });
  
  // Focus input on mount
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);
  
  // Setup keyboard shortcuts
  useKeyboardShortcuts(
    {
      '/': () => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      },
      'escape': () => {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        setQuery('');
      },
      's': () => {
        if (query.trim()) {
          search();
        }
      },
      'f': () => {
        setShowFilters(prev => !prev);
      },
      'k': () => {
        setShowKeyboardShortcuts(prev => !prev);
      }
    },
    { onlyWhenFocused: false }
  );
  
  const handleSearchChange = (value: string) => {
    setQuery(value);
  };
  
  const handleSearch = () => {
    search();
  };
  
  // Apply filters
  const applyFilters = () => {
    // Convert date strings to Date objects if they exist
    const fromDate = dateRange.from ? new Date(dateRange.from) : null;
    const toDate = dateRange.to ? new Date(dateRange.to) : null;
    
    updateFilters({
      contentTypes: selectedContentTypes,
      dateRange: {
        from: fromDate,
        to: toDate
      }
    });
    
    // If we have a query, trigger a search
    if (query) {
      search();
    }
    
    // On mobile, close the filter panel after applying
    if (window.innerWidth < 768) {
      setShowFilters(false);
    }
  };
  
  // Format time in ms to display with units
  const formatTime = (time: number) => {
    if (time < 1) return '0ms';
    if (time < 1000) return `${Math.round(time)}ms`;
    return `${(time / 1000).toFixed(2)}s`;
  };
  
  // Format number with commas for better readability
  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Calculate average score if results exist
  const calculateAverageScore = () => {
    if (!results.length) return '-';
    
    // Get all scores and calculate average
    const totalScore = results.reduce((sum, result) => {
      const score = result.scores?.final_score || result.score || 0;
      return sum + score * 100;
    }, 0);
    
    return `${Math.round(totalScore / results.length)}%`;
  };
  
  // Stats for display
  const statsData = [
    { 
      title: 'Time', 
      value: formatTime(executionTime), 
      icon: Clock, 
      testId: 'time',
      description: 'Total search execution time'
    },
    { 
      title: 'Results', 
      value: formatNumber(totalResults), 
      icon: Hash, 
      testId: 'results',
      description: `${formatNumber(totalResults)} documents found`
    },
    { 
      title: 'Score', 
      value: calculateAverageScore(),
      icon: BarChart2, 
      testId: 'score',
      description: 'Average relevance score'
    }
  ];
  
  return (
    <div className="w-full">
      {/* Keyboard Shortcuts Toast */}
      {showKeyboardShortcuts && (
        <Toast
          message={`
            Keyboard Shortcuts:
            / - Focus search
            Esc - Clear search
            S - Execute search
            F - Toggle filters
            K - Show/hide shortcuts
          `}
          type="info"
          onClose={() => setShowKeyboardShortcuts(false)}
          autoClose={true}
          duration={5000}
        />
      )}
    
      {/* Search Bar */}
      <div className="mb-6">
        <SearchBar
          value={query}
          onChange={handleSearchChange}
          onSearch={handleSearch}
          isLoading={isSearching}
          placeholder="Search documents..."
          ref={searchInputRef}
        />
        
        {/* Search Suggestions */}
        {suggestions.length > 0 && !hasResults && (
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-sm"
                onClick={() => {
                  setQuery(suggestion);
                  search();
                }}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        )}
      </div>
      
      {/* Action Buttons (Mobile) */}
      <div className="md:hidden mb-4 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="flex-1 flex items-center justify-center gap-2"
        >
          <div className="relative">
            <Filter className="h-4 w-4" />
            {(selectedContentTypes.length > 0 || dateRange.from || dateRange.to) && (
              <div className="absolute -top-1 -right-1 h-2 w-2 bg-blue-500 rounded-full"></div>
            )}
          </div>
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowKeyboardShortcuts(true)}
          className="flex items-center justify-center gap-2"
        >
          <Keyboard className="h-4 w-4" />
          <span className="sr-only">Keyboard Shortcuts</span>
        </Button>
      </div>
      
      {/* Responsive Layout */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Filters (Left Side on Desktop) */}
        {showFilters && (
          <div className="w-full md:w-64 flex-shrink-0">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">Filters</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="md:hidden"
                    onClick={() => setShowFilters(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Filter content */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm mb-2">Content Type</h4>
                    <div className="space-y-2">
                      {['PDF', 'Text', 'Word', 'HTML'].map(type => (
                        <div key={type} className="flex items-center">
                          <input 
                            type="checkbox" 
                            id={`type-${type}`}
                            checked={selectedContentTypes.includes(type)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedContentTypes(prev => [...prev, type]);
                              } else {
                                setSelectedContentTypes(prev => 
                                  prev.filter(t => t !== type)
                                );
                              }
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor={`type-${type}`} className="ml-2 text-sm text-gray-700">
                            {type}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm mb-2">Date Range</h4>
                    <div className="space-y-2">
                      <div>
                        <label htmlFor="date-from" className="block text-xs text-gray-700">From</label>
                        <input 
                          type="date" 
                          id="date-from" 
                          value={dateRange.from || ''}
                          onChange={(e) => setDateRange(prev => ({
                            ...prev,
                            from: e.target.value || null
                          }))}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="date-to" className="block text-xs text-gray-700">To</label>
                        <input 
                          type="date" 
                          id="date-to" 
                          value={dateRange.to || ''}
                          onChange={(e) => setDateRange(prev => ({
                            ...prev,
                            to: e.target.value || null
                          }))}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1" 
                      size="sm"
                      onClick={applyFilters}
                    >
                      Apply Filters
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedContentTypes([]);
                        setDateRange({ from: null, to: null });
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Main Content (Right Side on Desktop) */}
        <div className="flex-grow">
          {/* Search Stats */}
          {results.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              {statsData.map(({ title, value, icon: Icon, testId }) => (
                <MetricCard
                  key={title}
                  title={title}
                  value={value}
                  icon={Icon}
                  testId={testId}
                />
              ))}
            </div>
          )}
          
          {/* Active Filters Display */}
          {(selectedContentTypes.length > 0 || dateRange.from || dateRange.to) && (
            <div className="mb-4 flex flex-wrap gap-2 items-center">
              <span className="text-sm text-gray-500">Active filters:</span>
              
              {selectedContentTypes.map(type => (
                <div 
                  key={type}
                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center gap-1"
                >
                  {type}
                  <button 
                    onClick={() => {
                      setSelectedContentTypes(prev => prev.filter(t => t !== type));
                      applyFilters();
                    }}
                    className="hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              
              {dateRange.from && (
                <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center gap-1">
                  From: {new Date(dateRange.from).toLocaleDateString()}
                  <button 
                    onClick={() => {
                      setDateRange(prev => ({ ...prev, from: null }));
                      applyFilters();
                    }}
                    className="hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              
              {dateRange.to && (
                <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center gap-1">
                  To: {new Date(dateRange.to).toLocaleDateString()}
                  <button 
                    onClick={() => {
                      setDateRange(prev => ({ ...prev, to: null }));
                      applyFilters();
                    }}
                    className="hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              
              <button 
                className="text-xs text-gray-500 underline hover:text-gray-700"
                onClick={() => {
                  setSelectedContentTypes([]);
                  setDateRange({ from: null, to: null });
                  updateFilters({
                    contentTypes: [],
                    dateRange: { from: null, to: null }
                  });
                  if (query) search();
                }}
              >
                Clear all
              </button>
            </div>
          )}
          
          {/* Search Results */}
          <SearchResultList
            results={results}
            isLoading={isSearching}
            query={query}
          />
          
          {/* Error State */}
          {error && (
            <Card className="mb-6 border-red-300 bg-red-50">
              <CardContent className="p-6 text-center">
                <p className="text-red-600 mb-4">
                  {error.message || 'An error occurred during search'}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSearch}
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}
          
          {/* No Results */}
          {query && !isSearching && !error && results.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-500 mb-4">No results found for "{query}"</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSearch}
                >
                  Clear Search
                </Button>
              </CardContent>
            </Card>
          )}
          
          {/* Initial State */}
          {!query && !results.length && (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-500">Enter a search query to see results</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResponsiveSearch;
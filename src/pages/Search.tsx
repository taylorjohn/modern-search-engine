// src/pages/Search.tsx
import React, { useEffect } from 'react';
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
import { useSearchLogic } from '../hooks/useSearchLogic';

const Search = () => {
  const { state, dispatch } = useSearch();
  const { debouncedSearch } = useSearchLogic();

  useEffect(() => {
    if (state.query.trim()) {
      debouncedSearch();
    }
  }, [state.query, state.filters, state.options]);

  const resetSearch = () => {
    dispatch({ type: 'RESET_SEARCH' });
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Search Engine v2</h1>
        <p className="text-gray-600">
          Enhanced search with vector similarity and hybrid matching
        </p>
      </header>

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <SearchBar />
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Sliders className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Search Options</SheetTitle>
              <SheetDescription>
                Configure search settings and filters
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search Type</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={state.options.useVector}
                    onChange={(e) => dispatch({
                      type: 'SET_OPTIONS',
                      payload: {
                        ...state.options,
                        useVector: e.target.checked,
                      },
                    })}
                    className="rounded border-gray-300"
                  />
                  <span>Enable vector similarity search</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Field Weights</label>
                {Object.entries(state.options.boost).map(([field, value]) => (
                  <div key={field} className="space-y-1">
                    <label className="text-sm capitalize">{field}</label>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={value}
                      onChange={(e) => dispatch({
                        type: 'SET_OPTIONS',
                        payload: {
                          ...state.options,
                          boost: {
                            ...state.options.boost,
                            [field]: parseFloat(e.target.value),
                          },
                        },
                      })}
                      className="w-full"
                    />
                    <span className="text-sm">{value.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <Button
          variant="outline"
          size="icon"
          onClick={resetSearch}
          disabled={state.isLoading}
        >
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </div>

      {state.searchHistory.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-2">Recent Searches</h3>
          <div className="flex flex-wrap gap-2">
            {state.searchHistory.map((term, index) => (
              <button
                key={index}
                onClick={() => dispatch({ type: 'SET_QUERY', payload: term })}
                className="px-3 py-1 text-sm bg-gray-100 rounded-full hover:bg-gray-200"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {state.error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4 text-red-600">
            {state.error}
          </CardContent>
        </Card>
      )}

      {state.analytics && (
        <div className="mb-6">
          <SearchAnalytics analytics={state.analytics} />
        </div>
      )}

      {state.results.length > 0 ? (
        <SearchResults results={state.results} />
      ) : !state.isLoading && state.query && (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            No results found for "{state.query}"
          </CardContent>
        </Card>
      )}

      {state.isLoading && (
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-4 border-t-blue-600 border-blue-200 rounded-full animate-spin mb-4" />
              <p className="text-gray-500">Searching...</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Search;

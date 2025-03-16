import React, { useRef, useEffect, forwardRef } from 'react';
import { Search, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(({
  value, 
  onChange, 
  onSearch, 
  isLoading = false,
  placeholder = 'Search documents...',
  className = ''
}, ref) => {
  // Use internal ref if no external ref is provided
  const internalRef = useRef<HTMLInputElement>(null);
  const resolvedRef = (ref as React.RefObject<HTMLInputElement>) || internalRef;
  
  // Focus input on mount if no external ref is provided
  useEffect(() => {
    if (!ref && internalRef.current) {
      internalRef.current.focus();
    }
  }, [ref]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };
  
  const handleClear = () => {
    onChange('');
    if (resolvedRef.current) {
      resolvedRef.current.focus();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <label htmlFor="search-input" className="sr-only">Search documents</label>
        <Input
          id="search-input"
          ref={resolvedRef}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pl-10 pr-10"
          disabled={isLoading}
          aria-label="Search"
          aria-describedby="search-description"
          autoComplete="off"
          spellCheck="false"
        />
        <span id="search-description" className="sr-only">
          Enter keywords to search for documents
        </span>
        <Search 
          className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400
            transition-transform duration-200 ${isLoading ? 'scale-95' : 'scale-100'}`}
          aria-hidden="true"
        />
        {value && !isLoading && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full text-gray-400 hover:text-gray-600 
              focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <Button 
        type="submit" 
        disabled={isLoading}
        className="min-w-[100px] transition-all duration-200"
        aria-label={isLoading ? "Searching..." : "Search"}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span>Searching</span>
          </>
        ) : (
          <>
            <Search className="h-4 w-4 mr-2" />
            <span>Search</span>
          </>
        )}
      </Button>
    </form>
  );
});

SearchBar.displayName = 'SearchBar';

export default SearchBar;
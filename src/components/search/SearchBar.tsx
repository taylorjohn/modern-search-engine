// src/components/search/SearchBar.tsx
import React from 'react';
import { Search, Loader2, Command } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSearch } from '../../contexts/SearchContext';

interface SearchBarProps {
  onSearch: () => void;
  placeholder?: string;
  showCommand?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = 'Search documents...',
  showCommand = true,
}) => {
  const { state, dispatch } = useSearch();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div className="relative flex items-center">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <Search className="h-4 w-4" />
        </div>

        <Input
          type="text"
          value={state.query}
          onChange={(e) => dispatch({ type: 'SET_QUERY', payload: e.target.value })}
          placeholder={placeholder}
          className="pl-10 pr-20"
          disabled={state.isLoading}
        />

        {showCommand && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-xs text-gray-400">
            <Command className="h-3 w-3" />
            <span>+ Space</span>
          </div>
        )}
      </div>

      {state.query && (
        <Button
          type="submit"
          size="sm"
          variant="ghost"
          className="absolute right-2 top-1/2 -translate-y-1/2"
          disabled={state.isLoading}
        >
          {state.isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Search'
          )}
        </Button>
      )}
    </form>
  );
};

export default SearchBar;
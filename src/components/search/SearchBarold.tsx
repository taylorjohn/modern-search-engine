import React from 'react';
import { Search, Loader2, Command } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  isLoading?: boolean;
  placeholder?: string;
  showCommand?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onSearch,
  isLoading = false,
  placeholder = 'Search documents...',
  showCommand = true,
}) => {
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
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pl-10 pr-20"
          disabled={isLoading}
        />

        {showCommand && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-xs text-gray-400">
            <Command className="h-3 w-3" />
            <span>+ Space</span>
          </div>
        )}
      </div>

      {value && (
        <Button
          type="submit"
          size="sm"
          variant="ghost"
          className="absolute right-2 top-1/2 -translate-y-1/2"
          disabled={isLoading}
        >
          {isLoading ? (
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
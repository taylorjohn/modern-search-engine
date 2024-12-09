import React from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  isLoading?: boolean;
  placeholder?: string;
}

export default function SearchBar({ 
  value, 
  onChange, 
  onSearch, 
  isLoading = false,
  placeholder = 'Search documents...'
}: SearchBarProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pl-10"
          disabled={isLoading}
        />
        <Search 
          className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400
            transition-transform duration-200 ${isLoading ? 'scale-95' : 'scale-100'}`} 
        />
      </div>
      <Button 
        type="submit" 
        disabled={isLoading}
        className="min-w-[100px] transition-all duration-200"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          'Search'
        )}
      </Button>
    </form>
  );
}
import React from 'react';
import { Search } from 'lucide-react';

interface SearchInputProps {
  query: string;
  onChange: (value: string) => void;
  isLoading: boolean;
}

export default function SearchInput({ query, onChange, isLoading }: SearchInputProps) {
  return (
    <div className="flex gap-4 mt-8">
      <div className="relative flex-1">
        <input
          type="text"
          value={query}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search documents..."
          className="w-full px-10 py-2 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        {isLoading ? (
          <div className="absolute right-3 top-2.5 animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
        ) : (
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        )}
      </div>
    </div>
  );
}
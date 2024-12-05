// src/App.tsx
import React from 'react';
import { Sliders, RefreshCcw } from 'lucide-react';
import SearchBar from './components/search/SearchBar';
import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';

export default function App() {
  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Search Engine v2</h1>
        <p className="text-gray-600">
          Enhanced search with vector similarity
        </p>
      </header>

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <SearchBar 
            value=""
            onChange={() => {}}
            onSearch={() => {}}
            isLoading={false}
          />
        </div>

        <Button variant="outline" size="icon">
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardContent className="p-8 text-center text-gray-500">
          Enter a search query to begin
        </CardContent>
      </Card>
    </div>
  );
}
import React, { useState } from 'react';
import { Search, Info } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

const SearchBox = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  
  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(query);
  };
  
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Enhanced Search</CardTitle>
        <div className="text-sm text-gray-500">
          <p>Supported syntax:</p>
          <ul className="list-disc list-inside">
            <li>"exact phrase"</li>
            <li>field:value</li>
            <li>term~2 (fuzzy)</li>
            <li>wild* (wildcard)</li>
            <li>+must -not (operators)</li>
          </ul>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Try: "exact phrase" +must -not field:value wild* term~2'
            className="flex-1 p-2 border rounded"
          />
          <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
            Search
          </button>
        </form>
      </CardContent>
    </Card>
  );
};

const SearchResults = ({ results }) => {
  return (
    <div className="space-y-4">
      {results.map((result, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold">{result.title}</h3>
            <div className="mt-2">
              {result.highlights.map((highlight, i) => (
                <p key={i} className="text-sm" 
                   dangerouslySetInnerHTML={{ __html: highlight }} />
              ))}
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Score: {result.score.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const EnhancedSearch = () => {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (query) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setResults(data.results);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <SearchBox onSearch={handleSearch} />
      
      {isLoading && (
        <div className="text-center py-4">Searching...</div>
      )}
      
      {error && (
        <Card className="mb-4 bg-red-50">
          <CardContent className="p-4 text-red-600">
            Error: {error}
          </CardContent>
        </Card>
      )}
      
      {results.length > 0 && (
        <SearchResults results={results} />
      )}
    </div>
  );
};

export default EnhancedSearch;

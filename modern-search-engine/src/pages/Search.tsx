import React, { useState, useEffect } from 'react';

interface ScoreDetails {
  titleExactMatch: number;
  titlePartialMatch: number;
  contentExactMatch: number;
  contentPartialMatch: number;
  termFrequency: number;
  termProximity: number;
}

interface MatchDetails {
  titleMatch: boolean;
  contentMatch: boolean;
  matchedTerms: string[];
  totalMatches: number;
}

interface SearchResult {
  id: string;
  title: string;
  content: string;
  type?: string;
  score?: number;
  scores?: ScoreDetails;
  matchDetails?: MatchDetails;
  dateAdded?: Date;
}

interface SearchProps {
  onSearch: (query: string) => SearchResult[];
  documentCount: number;
}

export function Search({ onSearch, documentCount }: SearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [searchHistory, setSearchHistory] = useState<Array<{
    query: string;
    timestamp: Date;
    resultCount: number;
    topScore: number;
    time: number;
  }>>([]);

  const handleSearch = () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    const startTime = performance.now();

    // Use the search function passed from the parent component
    try {
      const searchResults = onSearch(query);
      setResults(searchResults);
      
      // Record search in history
      const endTime = performance.now();
      const elapsed = endTime - startTime;
      setSearchTime(elapsed);
      
      // Add to search history
      setSearchHistory(prev => {
        const newHistory = [
          {
            query,
            timestamp: new Date(),
            resultCount: searchResults.length,
            topScore: searchResults.length > 0 ? (searchResults[0].score || 0) : 0,
            time: elapsed
          },
          ...prev.slice(0, 9) // Keep only 10 most recent searches
        ];
        return newHistory;
      });
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Search when the query changes (with debounce)
  useEffect(() => {
    if (query.trim().length > 2) {
      const timer = setTimeout(() => {
        handleSearch();
      }, 300);
      
      return () => clearTimeout(timer);
    } else if (!query.trim()) {
      setResults([]);
    }
  }, [query]);

  // Get a preview of the content for display
  const getContentPreview = (content: string, query: string) => {
    if (!content) return '';
    
    // Try to find the query in the content
    const lowerContent = content.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerContent.indexOf(lowerQuery);
    
    if (index >= 0) {
      // Start a bit before the match
      const start = Math.max(0, index - 50);
      const end = Math.min(content.length, index + 150);
      const preview = content.substring(start, end);
      
      // Add ellipsis if needed
      return (start > 0 ? '...' : '') + preview + (end < content.length ? '...' : '');
    }
    
    // If query not found, return first part of content
    return content.substring(0, 150) + (content.length > 150 ? '...' : '');
  };

  // Highlight the query in the content
  const highlightQuery = (text: string, query: string) => {
    if (!query.trim() || !text) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() 
            ? <mark key={i} className="bg-yellow-200 px-0.5 rounded">{part}</mark> 
            : part
        )}
      </>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-2">Search Engine</h1>
      
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-gray-600">
          {documentCount === 0 
            ? 'No documents available. Please upload some documents first.'
            : `${documentCount} document${documentCount !== 1 ? 's' : ''} available for search`}
        </p>
        <button
          onClick={() => setShowAnalytics(!showAnalytics)}
          className="text-sm text-primary hover:text-primary-hover flex items-center gap-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18"></path>
            <path d="M18 9l-6-6-6 6"></path>
            <path d="M6 10l6-6 2 2"></path>
          </svg>
          {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
        </button>
      </div>
      
      <div className="mb-6">
        <div className="flex shadow-md rounded-lg overflow-hidden">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documents..."
            className="input flex-1 rounded-none rounded-l-lg"
            disabled={documentCount === 0}
          />
          <button 
            onClick={handleSearch}
            className="btn btn-primary rounded-none rounded-r-lg"
            disabled={!query.trim() || documentCount === 0 || isSearching}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>
      
      {/* Analytics Panel */}
      {showAnalytics && (
        <div className="mb-8 card bg-white">
          <div className="p-4 border-b">
            <h3 className="font-medium">Search Analytics</h3>
            <p className="text-xs text-gray-500">
              Track your search performance and history
            </p>
          </div>
          
          <div className="p-4">
            <h4 className="text-sm font-medium mb-2">Search Algorithm</h4>
            <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
              <p className="mb-2">This search engine uses multiple factors to rank results:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Title Exact Match (100%):</strong> The query appears exactly in the title</li>
                <li><strong>Title Partial Match (70%):</strong> Some query terms appear in the title</li>
                <li><strong>Content Exact Match (80%):</strong> The query appears exactly in the content</li>
                <li><strong>Content Partial Match (50%):</strong> Some query terms appear in the content</li>
                <li><strong>Term Frequency (60%):</strong> How often query terms appear in the content</li>
                <li><strong>Term Proximity (40%):</strong> How close query terms appear to each other</li>
              </ul>
              <p className="mt-2 italic">Scores are weighted and normalized to a 0-100% scale</p>
            </div>
            
            {searchHistory.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Recent Searches</h4>
                <div className="overflow-auto">
                  <table className="min-w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left">Query</th>
                        <th className="px-3 py-2 text-right">Results</th>
                        <th className="px-3 py-2 text-right">Top Score</th>
                        <th className="px-3 py-2 text-right">Time (ms)</th>
                        <th className="px-3 py-2 text-right">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {searchHistory.map((search, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-3 py-2 font-medium">{search.query}</td>
                          <td className="px-3 py-2 text-right">{search.resultCount}</td>
                          <td className="px-3 py-2 text-right">{Math.round(search.topScore * 100)}%</td>
                          <td className="px-3 py-2 text-right">{search.time.toFixed(1)}</td>
                          <td className="px-3 py-2 text-right text-gray-500">
                            {search.timestamp.toLocaleTimeString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {query.trim() && (
        <div className="mb-4">
          {searchTime > 0 && (
            <p className="text-xs text-gray-500">
              Search completed in {searchTime.toFixed(1)}ms
            </p>
          )}
        </div>
      )}

      {/* Search metric cards */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <div className="card p-4 bg-primary/5">
            <div className="text-sm text-gray-500">Results</div>
            <div className="text-xl font-semibold">{results.length}</div>
          </div>
          <div className="card p-4 bg-primary/5">
            <div className="text-sm text-gray-500">Search Time</div>
            <div className="text-xl font-semibold">{searchTime.toFixed(1)}ms</div>
          </div>
          <div className="card p-4 bg-primary/5">
            <div className="text-sm text-gray-500">Top Score</div>
            <div className="text-xl font-semibold">
              {results.length > 0 ? `${Math.round(results[0].score! * 100)}%` : '0%'}
            </div>
          </div>
          <div className="card p-4 bg-primary/5">
            <div className="text-sm text-gray-500">Matched Terms</div>
            <div className="text-xl font-semibold">
              {results.length > 0 && results[0].matchDetails 
                ? results[0].matchDetails.matchedTerms.length 
                : 0}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 space-y-4">
        {results.length > 0 ? (
          <div>
            <p className="text-sm text-gray-500 mb-4">Found {results.length} results for "{query}"</p>
            {results.map((result) => (
              <div key={result.id} className="card mb-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-semibold text-primary">
                    {highlightQuery(result.title, query)}
                  </h2>
                  {result.score !== undefined && (
                    <div className="bg-primary/10 text-primary px-2 py-1 rounded text-sm font-medium">
                      {Math.round(result.score * 100)}% Match
                    </div>
                  )}
                </div>
                
                {result.type && (
                  <p className="text-xs text-gray-500 mb-2">
                    Type: {result.type} | 
                    {result.dateAdded && ` Added: ${new Date(result.dateAdded).toLocaleDateString()}`}
                  </p>
                )}
                
                <div className="text-gray-700 prose max-w-none mb-4">
                  {highlightQuery(getContentPreview(result.content, query), query)}
                </div>
                
                {/* Score breakdown */}
                {result.scores && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <details className="text-xs">
                      <summary className="text-sm text-primary font-medium cursor-pointer hover:text-primary-hover">
                        Score Breakdown
                      </summary>
                      <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2 text-gray-600">
                        {Object.entries(result.scores).map(([key, value]) => (
                          <div key={key} className="flex justify-between bg-gray-50 p-2 rounded">
                            <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                            <span className="font-medium">{(value * 100).toFixed(0)}%</span>
                          </div>
                        ))}
                      </div>
                      {result.matchDetails && (
                        <div className="mt-2">
                          <div className="bg-gray-50 p-2 rounded mt-2">
                            <strong>Match Details:</strong> 
                            <ul className="list-disc list-inside mt-1">
                              {result.matchDetails.titleMatch && <li>Title match</li>}
                              {result.matchDetails.contentMatch && <li>Content match</li>}
                              <li>Total occurrences: {result.matchDetails.totalMatches}</li>
                              <li>
                                Matched terms: {result.matchDetails.matchedTerms.map((term, i) => (
                                  <span key={i} className="inline-block bg-yellow-100 px-1 rounded mr-1">
                                    {term}
                                  </span>
                                ))}
                              </li>
                            </ul>
                          </div>
                        </div>
                      )}
                    </details>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          query.trim() && !isSearching && (
            <div className="card text-center py-8">
              <p className="text-gray-500">No results found for "{query}"</p>
              <p className="text-sm text-gray-400 mt-2">
                Try using different keywords or upload more documents
              </p>
            </div>
          )
        )}
        
        {!query.trim() && documentCount > 0 && (
          <div className="card text-center py-8 bg-primary/5">
            <p className="text-gray-700">Start typing to search through your documents</p>
          </div>
        )}
        
        {documentCount === 0 && (
          <div className="card text-center py-8 bg-yellow-50">
            <p className="text-amber-800">No documents available for search</p>
            <p className="text-sm text-amber-700 mt-2">
              Click the "Upload" button in the navigation to add documents
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Search;
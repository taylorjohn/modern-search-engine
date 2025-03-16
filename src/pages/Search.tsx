import React, { useState, useCallback } from 'react';
import { Clock, Hash, BarChart2, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { MetricCard } from '@/components/ui';
import { DocumentUpload, ProcessingStatus } from '@/components/document';
import { SearchBar, SearchResultList, SearchHistory } from '@/components/search';
import { searchService } from '@/services';

interface SearchResult {
  id: string;
  title: string;
  content: string;
  documentType: string;
  scores: {
    vectorScore: number;
    finalScore: number;
  };
  metadata: {
    created: number;
    wordCount: number;
    type: string;
  };
}

interface SearchHistoryItem {
  query: string;
  results: number;
}

export default function Search() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [processingStatus, setProcessingStatus] = useState({
    id: '',
    status: 'pending',
    progress: 0,
    message: '',
  });
  const [stats, setStats] = useState({
    time: '0ms',
    results: 0,
    score: '0%',
    mode: 'text',
  });

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    const startTime = performance.now();

    try {
      // This would normally call an API, but for now we're using the local service
      const searchResults = searchService.search(searchQuery);
      const endTime = performance.now();

      setResults(searchResults);
      
      setStats({
        time: `${Math.round(endTime - startTime)}ms`,
        results: searchResults.length,
        score: searchResults.length > 0 
          ? `${Math.max(...searchResults.map(r => r.score * 100)).toFixed(1)}%`
          : '0%',
        mode: 'text',
      });
      
      setSearchHistory(prev => [
        { query: searchQuery, results: searchResults.length },
        ...prev.filter(item => item.query !== searchQuery).slice(0, 4)
      ]);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSearchChange = (value: string) => {
    setQuery(value);
    if (value.length > 2) {
      handleSearch(value);
    } else if (!value) {
      setResults([]);
    }
  };

  const handleFilesSelected = useCallback((files: File[]) => {
    if (files.length === 0) return;

    setProcessingStatus({
      id: Date.now().toString(),
      status: 'processing',
      progress: 0,
      message: 'Processing files...',
    });

    // Simulate file processing
    setTimeout(() => {
      setProcessingStatus((prev) => ({
        ...prev,
        status: 'completed',
        progress: 100,
        message: 'Processing complete',
      }));
    }, 2000); // Simulate 2 seconds of processing
  }, []);

  const handleHistorySelect = (selectedQuery: string) => {
    setQuery(selectedQuery);
    handleSearch(selectedQuery);
  };

  const statsData = [
    { title: 'Time', value: stats.time, icon: Clock, testId: 'time' },
    { title: 'Results', value: stats.results, icon: Hash, testId: 'results' },
    { title: 'Score', value: stats.score, icon: BarChart2, testId: 'score' },
    { title: 'Mode', value: stats.mode, icon: Zap, testId: 'mode' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-2">Modern Search Engine</h1>
      <p className="text-gray-600">Upload documents to start searching through their content</p>

      <div className="mt-8">
        <SearchBar
          value={query}
          onChange={handleSearchChange}
          onSearch={() => handleSearch(query)}
          isLoading={isLoading}
          placeholder="Search documents..."
        />
      </div>

      <div className="mt-8">
        <Card>
          <CardContent className="p-4">
            <DocumentUpload
              onFilesSelected={handleFilesSelected}
              accept="application/pdf,text/plain"
              maxSize={10485760}
            />
          </CardContent>
        </Card>
      </div>

      {processingStatus.status !== 'pending' && (
        <div className="mt-6">
          <ProcessingStatus
            status={{
              id: processingStatus.id,
              status: processingStatus.status,
              progress: processingStatus.progress,
              message: processingStatus.message,
            }}
          />
        </div>
      )}

      {searchHistory.length > 0 && (
        <div className="mt-6">
          <SearchHistory
            history={searchHistory}
            onSelect={handleHistorySelect}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        {statsData.map(({ title, value, icon, testId }) => (
          <MetricCard
            key={title}
            title={title}
            value={value}
            icon={icon}
            testId={testId}
          />
        ))}
      </div>

      <SearchResultList
        results={results.map(result => ({
          ...result,
          documentType: 'Document',
          scores: {
            vectorScore: result.score * 0.8,
            finalScore: result.score
          },
          metadata: {
            created: Date.now(),
            wordCount: result.content.split(/\s+/).length,
            type: 'Text'
          }
        }))}
        isLoading={isLoading}
        query={query}
      />
    </div>
  );
}
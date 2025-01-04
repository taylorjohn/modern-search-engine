// src/components/SearchWithMetrics.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { 
  Search as SearchIcon, 
  ChevronDown, 
  ChevronUp, 
  BarChart2, 
  Clock, 
  Hash, 
  Zap, 
  History
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import DocumentUpload from './DocumentUpload';
import { documentService } from '../services/documentService';
import type { MockDocument } from '../mockData';
import type { ProcessingStatus } from '../services/documentService';

interface SearchHistoryItem {
  query: string;
  results: number;
}

function ScoreBar({ label, score, color = "bg-blue-600" }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-24 text-sm text-gray-600">{label}:</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className={`${color} h-full transition-all duration-1000 ease-out`}
          style={{ width: `${score * 100}%` }}
          data-testid="score-bar-fill"
        />
      </div>
      <span className="w-16 text-sm text-gray-600 text-right">
        {(score * 100).toFixed(1)}%
      </span>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, testId }) {
  return (
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex justify-between items-start" data-testid={`metric-${testId}`}>
          <div>
            <h3 className="text-sm font-medium text-gray-500">{title}</h3>
            <p className="text-2xl font-bold" data-testid="metric-value">{value}</p>
          </div>
          <Icon className="h-5 w-5 text-gray-400" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function Search() {
  const [query, setQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState(new Set<string>());
  const [isLoading, setIsLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [processingDocuments, setProcessingDocuments] = useState<ProcessingStatus[]>([]);
  const [results, setResults] = useState<MockDocument[]>([]);
  const [stats, setStats] = useState({
    time: '0ms',
    results: 0,
    score: '0%',
    mode: 'vector'
  });

  useEffect(() => {
    const { unsubscribe } = documentService.subscribeToProcessing(updates => {
      setProcessingDocuments(updates);
    });

    return () => unsubscribe();
  }, []);

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    const startTime = performance.now();

    try {
      const searchResults = await documentService.searchDocuments(searchQuery);
      const endTime = performance.now();

      setResults(searchResults);
      
      setStats({
        time: `${Math.round(endTime - startTime)}ms`,
        results: searchResults.length,
        score: searchResults.length > 0 
          ? `${Math.max(...searchResults.map(r => r.scores.finalScore * 100)).toFixed(1)}%`
          : '0%',
        mode: 'vector'
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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    handleSearch(value);
  };

  const handleHistorySelect = (selectedQuery: string) => {
    setQuery(selectedQuery);
    handleSearch(selectedQuery);
  };

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const statsData = [
    { title: 'Time', value: stats.time, icon: Clock, testId: 'time' },
    { title: 'Results', value: stats.results, icon: Hash, testId: 'results' },
    { title: 'Score', value: stats.score, icon: BarChart2, testId: 'score' },
    { title: 'Mode', value: stats.mode, icon: Zap, testId: 'mode' }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Modern Search Engine</h1>
        <p className="text-gray-600">Search uploaded documents with vector similarity</p>
      </div>

      <div className="relative">
        <Input
          type="text"
          value={query}
          onChange={handleSearchChange}
          placeholder="Search documents..."
          className="w-full pl-10 pr-4"
          data-testid="search-input"
        />
        {isLoading ? (
          <div 
            className="absolute right-3 top-2.5 animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"
            role="progressbar" 
            aria-label="Loading search results"
          />
        ) : (
          <SearchIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        )}
      </div>

      <DocumentUpload />

      {processingDocuments.length > 0 && (
        <div className="mt-6 space-y-2">
          {processingDocuments.map((doc) => (
            <Card key={doc.filename}>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{doc.filename}</h3>
                    <p className="text-sm text-gray-500">
                      {doc.status === 'processing' ? 'Processing...' : 
                       doc.status === 'complete' ? 'Complete' : 'Error'}
                    </p>
                  </div>
                  
                  {doc.progress !== undefined && (
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${doc.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {searchHistory.length > 0 && (
        <Card className="mt-6">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <History className="h-4 w-4" />
              Recent Searches
            </h3>
            <div className="flex flex-wrap gap-2">
              {searchHistory.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleHistorySelect(item.query)}
                  className="px-3 py-1 text-sm bg-gray-100 rounded-full hover:bg-gray-200 transition-colors flex items-center gap-2 group"
                >
                  <span>{item.query}</span>
                  <span className="text-xs text-gray-500 group-hover:text-gray-700">({item.results})</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
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

      {results.length === 0 && query && !isLoading ? (
        <Card className="mt-8">
          <CardContent className="p-6 text-center text-gray-500">
            No documents found. Try uploading some documents first.
          </CardContent>
        </Card>
      ) : (
        <div className="mt-8 space-y-4">
          {results.map((result) => (
            <Card key={result.id}>
              <CardContent className="p-6">
                <div className="flex justify-between">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    {result.title}
                    <span className="text-sm text-gray-500">
                      ({result.documentType})
                    </span>
                  </h2>
                  <span className="text-2xl font-bold text-blue-600">
                    {(result.scores.finalScore * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="mt-2 text-gray-600">{result.content}</p>

                <button
                  onClick={() => toggleExpand(result.id)}
                  className="mt-4 text-sm text-blue-600 flex items-center gap-1 hover:text-blue-800"
                  data-testid="toggle-details"
                >
                  {expandedItems.has(result.id) ? (
                    <>Hide Details <ChevronUp className="w-4 h-4" /></>
                  ) : (
                    <>Show Details <ChevronDown className="w-4 h-4" /></>
                  )}
                </button>

                {expandedItems.has(result.id) && (
                  <div className="mt-4 pt-4 border-t space-y-4 animate-fade-in">
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Score Breakdown</h3>
                      <ScoreBar label="Vector Score" score={result.scores.vectorScore} color="bg-purple-500" />
                      <ScoreBar label="Final Score" score={result.scores.finalScore} color="bg-blue-600" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Created:</span>
                        <span className="ml-2">{new Date(result.metadata.created).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Word Count:</span>
                        <span className="ml-2">{result.metadata.wordCount.toLocaleString()}</span>
                      </div>
                      <div>
                        <span
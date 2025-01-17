import React, { useState, useCallback } from 'react';
import { Search as SearchIcon, Clock, Hash, BarChart2, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import DocumentUpload from './DocumentUpload';
import ProcessingStatus from './ProcessingStatus';

export default function Search() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [processingStatus, setProcessingStatus] = useState({
    id: '',
    status: 'pending',
    progress: 0,
    message: ''
  });

  const handleFilesSelected = useCallback((files: File[]) => {
    if (files.length === 0) return;
    
    setProcessingStatus({
      id: Date.now().toString(),
      status: 'processing',
      progress: 0,
      message: 'Processing files...'
    });

    // Simulate file processing
    setTimeout(() => {
      setProcessingStatus(prev => ({
        ...prev,
        status: 'completed',
        progress: 100,
        message: 'Processing complete'
      }));
    }, 2000);
  }, []);

  const statsData = [
    { title: 'Time', value: '0s', icon: Clock },
    { title: 'Results', value: '0', icon: Hash },
    { title: 'Score', value: '0%', icon: BarChart2 },
    { title: 'Mode', value: 'text', icon: Zap }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-2">Modern Search Engine</h1>
      <p className="text-gray-600">Upload documents to start searching through their content</p>

      <div className="flex gap-4 mt-8">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documents..."
            className="w-full px-10 py-2 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            data-testid="search-input"
          />
          <SearchIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
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
              message: processingStatus.message
            }}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        {statsData.map(({ title, value, icon: Icon }) => (
          <Card key={title} className="hover:shadow-lg transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">{title}</h3>
                  <p className="text-2xl font-bold">{value}</p>
                </div>
                <Icon className="h-5 w-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
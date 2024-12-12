// src/pages/Upload.tsx
import React, { useState } from 'react';
import { Upload as UploadIcon, AlertCircle } from 'lucide-react';
import DocumentUpload from '../components/document/DocumentUpload';
import ProcessingStatus from '../components/document/ProcessingStatus';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import type { ProcessingStatus as ProcessingStatusType } from '../types';
import { api } from '../services/api';

export function Upload() {
  const [uploadQueue, setUploadQueue] = useState<ProcessingStatusType[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = async (files: File[]) => {
    setIsUploading(true);
    setError(null);

    for (const file of files) {
      const processingId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Initialize status
      setUploadQueue(prev => [...prev, {
        id: processingId,
        status: 'pending',
        progress: 0,
      }]);

      try {
        // Start upload
        updateStatus(processingId, 'processing', 10);
        const result = await api.uploadDocument(file);
        
        // Poll for status
        const interval = setInterval(async () => {
          try {
            const status = await api.getProcessingStatus(result.id);
            updateStatus(
              processingId, 
              status.status, 
              status.progress, 
              status.result
            );
            
            if (status.status === 'completed' || status.status === 'failed') {
              clearInterval(interval);
            }
          } catch (err) {
            clearInterval(interval);
            updateStatus(
              processingId, 
              'failed', 
              0, 
              undefined, 
              'Failed to get status update'
            );
          }
        }, 1000);

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Upload failed';
        updateStatus(processingId, 'failed', 0, undefined, errorMessage);
        setError(`Failed to upload ${file.name}`);
      }
    }

    setIsUploading(false);
  };

  const updateStatus = (
    id: string,
    status: ProcessingStatusType['status'],
    progress: number,
    result?: any,
    error?: string
  ) => {
    setUploadQueue(prev => prev.map(item => 
      item.id === id
        ? { ...item, status, progress, result, error }
        : item
    ));
  };

  const clearCompleted = () => {
    setUploadQueue(prev => prev.filter(item => item.status !== 'completed'));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Upload Documents</h1>
        <p className="text-gray-600">
          Upload documents for vector search processing
        </p>
      </header>

      <Card className="mb-6">
        <CardContent className="p-6">
          <DocumentUpload
            onFilesSelected={handleFilesSelected}
            disabled={isUploading}
          />
        </CardContent>
      </Card>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {uploadQueue.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Processing Queue</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={clearCompleted}
            >
              Clear Completed
            </Button>
          </div>

          {uploadQueue.map((item) => (
            <ProcessingStatus
              key={item.id}
              status={item}
              onRetry={() => {
                updateStatus(item.id, 'pending', 0);
                // Implement retry logic
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
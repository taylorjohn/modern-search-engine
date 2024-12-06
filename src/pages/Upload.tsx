// src/pages/Upload.tsx
import React, { useState } from 'react';
import { Upload as UploadIcon, AlertCircle } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import DocumentUpload from '../components/document/DocumentUpload';
import ProcessingStatus from '../components/document/ProcessingStatus';
import type { ProcessingStatus as ProcessingStatusType } from '../types';

const Upload = () => {
  const [uploadQueue, setUploadQueue] = useState<ProcessingStatusType[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = async (files: File[]) => {
    setIsUploading(true);
    setError(null);

    for (const file of files) {
      const processingId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Initialize processing status
      setUploadQueue(prev => [...prev, {
        id: processingId,
        status: 'pending',
        progress: 0,
      }]);

      try {
        const formData = new FormData();
        formData.append('file', file);

        // Start upload
        updateStatus(processingId, 'processing', 10);

        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Simulate successful processing
        updateStatus(processingId, 'completed', 100, {
          id: processingId,
          title: file.name,
          content_type: file.type,
          word_count: Math.floor(Math.random() * 1000) + 100,
          vector_embedding: Array.from({ length: 10 }, () => Math.random()),
          processing_time_ms: Math.floor(Math.random() * 1000) + 500
        });

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
    result?: ProcessingStatusType['result'],
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
    <div className="container mx-auto p-4 max-w-4xl">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Upload Documents</h1>
        <p className="text-gray-600">
          Support for PDF, HTML, and text documents with automatic processing
        </p>
      </header>

      <Card className="mb-6">
        <CardContent className="p-6">
          <DocumentUpload
            onFilesSelected={handleFilesSelected}
            disabled={isUploading}
            accept=".pdf,.txt,.html"
            maxSize={10 * 1024 * 1024} // 10MB
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
                handleFilesSelected([new File([], item.id)]);
              }}
            />
          ))}

          {/* Upload Statistics */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Upload Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Total</div>
                  <div className="text-2xl font-semibold">{uploadQueue.length}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Completed</div>
                  <div className="text-2xl font-semibold text-green-600">
                    {uploadQueue.filter(item => item.status === 'completed').length}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Processing</div>
                  <div className="text-2xl font-semibold text-blue-600">
                    {uploadQueue.filter(item => item.status === 'processing').length}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Failed</div>
                  <div className="text-2xl font-semibold text-red-600">
                    {uploadQueue.filter(item => item.status === 'failed').length}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Upload;
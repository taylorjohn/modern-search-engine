// src/pages/Upload.tsx
import React, { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Upload as UploadIcon, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import DocumentUpload from '@/components/DocumentUpload';
import { documentService } from '../services/documentService';

interface ProcessingStatus {
  id: string;
  file: string;
  status: 'queued' | 'processing' | 'complete' | 'failed';
  progress: number;
  error?: string;
}

export default function Upload() {
  const [processingFiles, setProcessingFiles] = useState<ProcessingStatus[]>([]);

  const handleFilesSelected = useCallback(async (files: File[]) => {
    for (const file of files) {
      // Add file to processing queue
      const id = Math.random().toString(36).substring(7);
      setProcessingFiles(prev => [...prev, {
        id,
        file: file.name,
        status: 'processing',
        progress: 0
      }]);

      try {
        // Process file with progress updates
        setProcessingFiles(prev => prev.map(item =>
          item.id === id ? { ...item, progress: 30 } : item
        ));

        // Process the document
        await documentService.processDocument(file);

        // Mark as complete
        setProcessingFiles(prev => prev.map(item =>
          item.id === id ? { ...item, status: 'complete', progress: 100 } : item
        ));
      } catch (error) {
        // Handle error
        setProcessingFiles(prev => prev.map(item =>
          item.id === id ? {
            ...item,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Processing failed'
          } : item
        ));
      }
    }
  }, []);

  const handleRetry = useCallback((fileId: string) => {
    setProcessingFiles(prev => prev.map(item =>
      item.id === fileId ? { ...item, status: 'queued', progress: 0, error: undefined } : item
    ));
  }, []);

  const handleClear = useCallback(() => {
    setProcessingFiles(prev => prev.filter(item => item.status !== 'complete'));
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-2">Document Upload</h1>
      <p className="text-gray-600 mb-8">Upload documents to be processed for vector search</p>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UploadIcon className="h-6 w-6" />
            Upload Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentUpload
            onFilesSelected={handleFilesSelected}
            accept="application/pdf,text/html,text/plain"
            maxSize={10 * 1024 * 1024} // 10MB
            multiple={true}
          />

          {processingFiles.length > 0 && (
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Processing Queue</h3>
                <Button variant="outline" onClick={handleClear}>
                  Clear Completed
                </Button>
              </div>

              <div className="space-y-4">
                {processingFiles.map((file) => (
                  <Card key={file.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {file.status === 'processing' && (
                            <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                          )}
                          {file.status === 'complete' && (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          )}
                          {file.status === 'failed' && (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                          <span className="font-medium">{file.file}</span>
                        </div>
                        
                        {file.status === 'failed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRetry(file.id)}
                            className="flex items-center gap-2"
                          >
                            <RefreshCw className="h-4 w-4" />
                            Retry
                          </Button>
                        )}
                      </div>

                      {file.error && (
                        <p className="mt-2 text-sm text-red-600">{file.error}</p>
                      )}

                      <div className="mt-3 space-y-1">
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>
                            {file.status === 'complete'
                              ? 'Complete'
                              : file.status === 'failed'
                              ? 'Failed'
                              : 'Processing...'}
                          </span>
                          <span>{file.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              file.status === 'complete'
                                ? 'bg-green-500'
                                : file.status === 'failed'
                                ? 'bg-red-500'
                                : 'bg-blue-500'
                            }`}
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
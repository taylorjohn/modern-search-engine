import React, { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Upload as UploadIcon, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import DocumentUpload from '@/components/document/DocumentUpload';
import { uploadService } from '@/services/uploadService';
import { documentService } from '@/services/documentService';

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
    console.log('Files selected:', files);
    // Create processing status for each file
    const newFiles = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      file: file.name,
      status: 'queued' as const,
      progress: 0
    }));

    setProcessingFiles(prev => [...prev, ...newFiles]);

    // Process each file
    for (const file of files) {
      try {
        // Update status to processing
        setProcessingFiles(prev => 
          prev.map(f => 
            f.file === file.name 
              ? { ...f, status: 'processing' }
              : f
          )
        );

        // Upload file with progress updates
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
        
        // Update progress in chunks
        for (let progress = 0; progress <= 100; progress += 20) {
          setProcessingFiles(prev => 
            prev.map(f => 
              f.file === file.name 
                ? { ...f, progress }
                : f
            )
          );
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        // Process document
        await documentService.processDocument(file);

        // Mark as complete
        setProcessingFiles(prev => 
          prev.map(f => 
            f.file === file.name 
              ? { ...f, status: 'complete', progress: 100 }
              : f
          )
        );

      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        setProcessingFiles(prev => 
          prev.map(f => 
            f.file === file.name 
              ? { 
                  ...f, 
                  status: 'failed', 
                  error: error instanceof Error ? error.message : 'Processing failed'
                }
              : f
          )
        );
      }
    }
  }, []);

  const handleUploadError = useCallback((error: Error, fileName: string) => {
    console.error('Upload error:', error, fileName);
    setProcessingFiles(prev => 
      prev.map(f => 
        f.file === fileName 
          ? { ...f, status: 'failed', error: error.message }
          : f
      )
    );
  }, []);

  const handleRetry = useCallback(async (fileName: string) => {
    const file = processingFiles.find(f => f.file === fileName);
    if (!file) return;

    setProcessingFiles(prev => 
      prev.map(f => 
        f.file === fileName 
          ? { ...f, status: 'queued', progress: 0, error: undefined }
          : f
      )
    );

    // Create a dummy file for retry simulation
    const dummyFile = new File([''], fileName);
    await handleFilesSelected([dummyFile]);
  }, [handleFilesSelected, processingFiles]);

  const handleClear = useCallback(() => {
    setProcessingFiles([]);
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
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
            onUploadError={handleUploadError}
            maxSize={10 * 1024 * 1024} // 10MB
            multiple={true}
            disabled={false}
            uploadService={uploadService}
          />

          {processingFiles.length > 0 && (
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Processing Queue</h3>
                <Button variant="outline" onClick={handleClear}>
                  Clear All
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
                            onClick={() => handleRetry(file.file)}
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
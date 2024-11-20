import React, { useState, useCallback } from 'react';
import { Upload as UploadIcon, File, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DocumentUpload from '../components/document/DocumentUpload';
import ProcessingStatus from '../components/document/ProcessingStatus';

interface UploadStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message?: string;
  result?: any;
}

const Upload = () => {
  const [uploadQueue, setUploadQueue] = useState<UploadStatus[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = useCallback((files: File[]) => {
    setSelectedFiles(prev => [...prev, ...files]);
    setUploadError(null);
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const processFiles = async () => {
    setIsUploading(true);
    setUploadError(null);

    for (const file of selectedFiles) {
      const uploadId = Math.random().toString(36).substr(2, 9);
      
      // Add to queue
      setUploadQueue(prev => [...prev, {
        id: uploadId,
        status: 'pending',
        progress: 0,
      }]);

      try {
        // Create form data
        const formData = new FormData();
        formData.append('file', file);

        // Start upload
        setUploadQueue(prev => 
          prev.map(item => 
            item.id === uploadId 
              ? { ...item, status: 'processing', progress: 10 }
              : item
          )
        );

        const response = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        const data = await response.json();

        // Update queue with success
        setUploadQueue(prev =>
          prev.map(item =>
            item.id === uploadId
              ? { 
                  ...item, 
                  status: 'completed',
                  progress: 100,
                  result: data,
                }
              : item
          )
        );
      } catch (error) {
        // Update queue with error
        setUploadQueue(prev =>
          prev.map(item =>
            item.id === uploadId
              ? { 
                  ...item, 
                  status: 'failed',
                  message: error instanceof Error ? error.message : 'Upload failed',
                }
              : item
          )
        );

        setUploadError(`Failed to upload ${file.name}`);
      }
    }

    setIsUploading(false);
    setSelectedFiles([]);
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

      {/* Upload Area */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <DocumentUpload
            onFilesSelected={handleFileSelect}
            accept=".pdf,.html,.txt"
            maxSize={10485760} // 10MB
          />

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Selected Files</h3>
              <div className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <div className="flex items-center space-x-2">
                      <File className="w-4 h-4" />
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveFile(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedFiles([])}
                  disabled={isUploading}
                >
                  Clear All
                </Button>
                <Button
                  onClick={processFiles}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <UploadIcon className="w-4 h-4 mr-2" />
                      Process Files
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Queue */}
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
            <Card key={item.id}>
              <CardContent className="p-4">{/* Continuing from previous Card/CardContent */}
              <div className="space-y-3">
                {/* Status Icon */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {item.status === 'processing' && (
                      <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                    )}
                    {item.status === 'completed' && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                    {item.status === 'failed' && (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className="font-medium capitalize">
                      {item.status}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    ID: {item.id}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      item.status === 'failed'
                        ? 'bg-red-500'
                        : item.status === 'completed'
                        ? 'bg-green-500'
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>

                {/* Status Message */}
                {item.message && (
                  <div className={`text-sm ${
                    item.status === 'failed' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {item.message}
                  </div>
                )}

                {/* Result Summary (for completed items) */}
                {item.status === 'completed' && item.result && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium mb-2">Processing Result</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-gray-600">Title:</span>
                      <span>{item.result.title}</span>
                      
                      <span className="text-gray-600">Type:</span>
                      <span>{item.result.content_type}</span>
                      
                      <span className="text-gray-600">Words:</span>
                      <span>{item.result.word_count}</span>
                      
                      {item.result.language && (
                        <>
                          <span className="text-gray-600">Language:</span>
                          <span>{item.result.language}</span>
                        </>
                      )}
                      
                      <span className="text-gray-600">Processing Time:</span>
                      <span>{item.result.processing_time_ms}ms</span>
                    </div>

                    {/* Vector Embedding Info */}
                    {item.result.vector_embedding && (
                      <div className="mt-2 text-sm">
                        <span className="text-gray-600">Vector Dimension:</span>
                        <span className="ml-2">
                          {item.result.vector_embedding.length}
                        </span>
                      </div>
                    )}

                    {/* Tags */}
                    {item.result.metadata?.tags?.length > 0 && (
                      <div className="mt-2">
                        <span className="text-sm text-gray-600">Tags:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.result.metadata.tags.map((tag: string, i: number) => (
                            <span
                              key={i}
                              className="px-2 py-1 text-xs bg-gray-200 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Retry Button for Failed Items */}
                {item.status === 'failed' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      // Reset status and retry processing
                      setUploadQueue(prev =>
                        prev.map(qItem =>
                          qItem.id === item.id
                            ? { ...qItem, status: 'pending', progress: 0, message: undefined }
                            : qItem
                        )
                      );
                      // Trigger reprocess
                      processFiles();
                    }}
                  >
                    <RefreshCcw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )}

    {/* Error Message */}
    {uploadError && (
      <Card className="mt-6 border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span>{uploadError}</span>
          </div>
        </CardContent>
      </Card>
    )}

    {/* Upload Statistics */}
    {uploadQueue.length > 0 && (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Upload Statistics</CardTitle>
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
    )}
  </div>
);
};

export default Upload;
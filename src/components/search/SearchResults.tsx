import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  onFilesSelected: (files: File[]) => void;
  onUploadError?: (error: Error, fileName: string) => void;
  disabled?: boolean;
  accept?: string;
  maxSize?: number;
  multiple?: boolean;
}

interface UploadStatus {
  fileName: string;
  progress: number;
  error?: string;
}

const DocumentUpload: React.FC<Props> = ({
  onFilesSelected,
  onUploadError,
  disabled = false,
  accept = 'application/pdf,text/html,text/plain',
  maxSize = 10485760, // 10MB
  multiple = true,
}) => {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (files: File[]) => {
    if (files.length === 0) return;
    
    const file = files[0];
    setIsUploading(true);
    setUploadStatus({ fileName: file.name, progress: 0 });

    try {
      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += 10) {
        setUploadStatus(prev => ({ ...prev!, progress }));
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      onFilesSelected(files);
    } catch (error) {
      const uploadError = error instanceof Error ? error : new Error('Upload failed');
      setUploadStatus(prev => ({ ...prev!, error: uploadError.message }));
      onUploadError?.(uploadError, file.name);
    } finally {
      setIsUploading(false);
    }
  };

  const cancelUpload = () => {
    setIsUploading(false);
    setUploadStatus(null);
  };

  const retryUpload = useCallback(() => {
    if (!uploadStatus) return;
    handleUpload([new File([], uploadStatus.fileName)]);
  }, [uploadStatus]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop: handleUpload,
    accept: {
      'application/pdf': ['.pdf'],
      'text/html': ['.html', '.htm'],
      'text/plain': ['.txt'],
    },
    maxSize,
    multiple,
    disabled: disabled || isUploading,
  });

  return (
    <div className="space-y-4" data-testid="document-upload">
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200 ease-in-out
          ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}
          ${isDragReject ? 'border-red-400 bg-red-50' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        data-testid="dropzone"
      >
        <input {...getInputProps()} />
        <Upload
          className={`mx-auto h-12 w-12 mb-4 ${
            isDragActive ? 'text-blue-500' : 'text-gray-400'
          }`}
        />

        <div className="text-sm">
          <p className="font-medium mb-1">
            {isDragActive ? 'Drop files here...' : 'Drag and drop files here, or click to select'}
          </p>
          <p className="text-gray-500" data-testid="size-limit">
            Supported formats: PDF, HTML, TXT (max {maxSize / 1024 / 1024} MB)
          </p>
        </div>
      </div>

      {uploadStatus && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium">{uploadStatus.fileName}</span>
            {uploadStatus.error ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={retryUpload}
                  aria-label="retry upload"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Retry
                </Button>
              </div>
            ) : (
              isUploading && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cancelUpload}
                  aria-label="cancel upload"
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              )
            )}
          </div>

          {uploadStatus.error ? (
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span>{uploadStatus.error}</span>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Progress</span>
                <span>{uploadStatus.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadStatus.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;
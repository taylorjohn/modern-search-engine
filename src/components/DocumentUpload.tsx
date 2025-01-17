import React, { useCallback, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { documentService } from '@/services/documentService';

interface DocumentUploadProps {
  onUploadComplete?: (file: File) => void;
  disabled?: boolean;
  maxSize?: number;
  multiple?: boolean;
}

export default function DocumentUpload({
  onUploadComplete,
  disabled = false,
  maxSize = 10485760, // 10MB
  multiple = false,
}: DocumentUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (disabled || isUploading) return;

    const files = Array.from(event.dataTransfer.files);
    if (!files.length) return;

    // Check file types
    const validTypes = ['text/plain', 'application/pdf'];
    const allValid = files.every(file => validTypes.includes(file.type));
    
    if (!allValid) {
      setError('Invalid file type. Please upload only TXT or PDF files.');
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      for (const file of files) {
        await documentService.uploadDocument(file);
        onUploadComplete?.(file);
      }
    } catch (error) {
      setError('File upload failed. Please try again.');
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <Card>
      <CardContent>
        <div
          data-testid="dropzone"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors duration-200 ease-in-out
            ${isUploading ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}
            ${error ? 'border-red-400 bg-red-50' : ''}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {isUploading ? (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          ) : (
            <Upload className="mx-auto h-12 w-12 mb-4 text-gray-400" />
          )}

          <div className="text-sm">
            <p className="font-medium mb-1">
              {isUploading
                ? 'Uploading...'
                : 'Drag and drop files here, or click to select'}
            </p>
            <p className="text-gray-500">
              Supported formats: TXT, PDF (max {(maxSize / 1024 / 1024).toFixed(0)}MB)
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-4 p-3 bg-red-50 rounded text-red-600 text-sm"
            >
              {error}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
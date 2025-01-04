// src/components/DocumentUpload.tsx
import React, { useCallback, useState } from 'react';
import { Upload } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { documentService } from '@/services/documentService';

interface DocumentUploadProps {
  disabled?: boolean;
  maxSize?: number; // in MB
}

export default function DocumentUpload({ disabled = false, maxSize = 5 }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = useCallback(async (files: FileList | null) => {
    if (!files?.length || disabled) return;
    setError(null);

    for (let i = 0; i < files.length; i++) {
      try {
        const file = files[i];
        if (file.size > maxSize * 1024 * 1024) {
          setError('File too large');
          continue;
        }
        await documentService.uploadDocument(file);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Error uploading file');
        console.error('Error uploading file:', error);
      }
    }
  }, [disabled, maxSize]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled) {
      handleUpload(e.dataTransfer.files);
    }
  }, [disabled, handleUpload]);

  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        <div
          data-testid="dropzone"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative cursor-pointer
            py-8 px-6 border-2 border-dashed rounded-lg
            ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-500'}
            transition-colors
          `}
        >
          <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            multiple
            accept=".txt,.pdf,.doc,.docx,.html,.md"
            onChange={(e) => handleUpload(e.target.files)}
            disabled={disabled}
            data-testid="file-input"
          />
          
          <div className="text-center pointer-events-none">
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600 mb-2">
              Drag and drop files here, or click to select
            </p>
            <p className="text-sm text-gray-500">
              Supported formats: PDF, TXT, DOC, HTML, MD (max {maxSize}MB)
            </p>
            {error && (
              <p className="mt-2 text-sm text-red-500" role="alert">
                {error}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
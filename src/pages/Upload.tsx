// src/pages/Upload.tsx
import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Upload as UploadIcon } from 'lucide-react';
import { documentService } from '@/services';

export default function Upload() {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files?.length) return;

    setIsUploading(true);
    try {
      // Process each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log('Processing file:', file.name);
        await documentService.uploadDocument(file);
      }

      // Navigate back to search after all files are processed
      navigate('/');
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setIsUploading(false);
    }
  }, [navigate]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        onClick={() => navigate('/')}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Search
      </Button>

      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Upload Documents</h2>
            <p className="text-gray-600 mb-6">
              Select files to upload and process for search
            </p>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                relative cursor-pointer
                py-12 px-6 border-2 border-dashed rounded-lg
                ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
                hover:border-blue-500 transition-colors
              `}
            >
              <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                multiple
                accept=".txt,.pdf,.doc,.docx,.html,.md"
                onChange={(e) => handleFiles(e.target.files)}
                disabled={isUploading}
                data-testid="file-input"
              />
              
              <div className="text-center">
                <UploadIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600">
                  {isUploading ? 'Uploading...' : 'Drag and drop files here, or click to select'}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Supported formats: TXT, PDF, DOC, HTML, MD
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
// src/components/DocumentUpload.tsx
import React, { useCallback } from 'react';
import { Upload } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { documentService } from '@/services/documentService';

export default function DocumentUpload() {
  const handleUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;

    try {
      for (let i = 0; i < files.length; i++) {
        await documentService.uploadDocument(files[i]);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
    }
  }, []);

  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        <label className="block cursor-pointer">
          <input
            type="file"
            multiple
            accept=".txt,.pdf,.doc,.docx,.html,.md"
            onChange={handleUpload}
            className="hidden"
            data-testid="file-input"
          />
          <div className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors">
            <Upload className="h-5 w-5 text-gray-400" />
            <span className="text-gray-600">Click to upload documents</span>
          </div>
        </label>
      </CardContent>
    </Card>
  );
}
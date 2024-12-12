// src/components/document/DocumentUpload.tsx
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X } from 'lucide-react';

interface Props {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  accept?: string;
  maxSize?: number;
  multiple?: boolean;
}

const DocumentUpload: React.FC<Props> = ({
  onFilesSelected,
  disabled = false,
  accept = 'application/pdf,text/html,text/plain',
  maxSize = 10485760, // 10MB
  multiple = true,
}) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!disabled) {
      onFilesSelected(acceptedFiles);
    }
  }, [disabled, onFilesSelected]);

  const { 
    getRootProps, 
    getInputProps, 
    isDragActive,
    isDragReject 
  } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/html': ['.html', '.htm'],
      'text/plain': ['.txt'],
    },
    maxSize,
    multiple,
    disabled,
  });

  return (
    <div
      {...getRootProps()}
      className={`
        relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
        transition-colors duration-200 ease-in-out
        ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}
        ${isDragReject ? 'border-red-400 bg-red-50' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input {...getInputProps()} />
      <Upload
        className={`mx-auto h-12 w-12 mb-4 ${
          isDragActive ? 'text-blue-500' : 'text-gray-400'
        }`}
      />

      <div className="text-sm">
        <p className="font-medium mb-1">
          {isDragActive
            ? 'Drop files here...'
            : 'Drag and drop files here, or click to select'}
        </p>
        <p className="text-gray-500">
          Supported formats: PDF, HTML, TXT (max {(maxSize / 1024 / 1024).toFixed(0)}MB)
        </p>
      </div>

      {isDragReject && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 bg-opacity-90 rounded-lg">
          <div className="text-red-500 font-medium">
            <X className="h-8 w-8 mx-auto mb-2" />
            Invalid file type or size
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;
// src/components/document/DocumentUpload.tsx
import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X } from 'lucide-react';

interface Props {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  accept?: Record<string, string[]>;
  maxSize?: number;
  multiple?: boolean;
}

const DocumentUpload: React.FC<Props> = ({
  onFilesSelected,
  disabled = false,
  accept = {
    'application/pdf': ['.pdf'],
    'text/html': ['.html', '.htm'],
    'text/plain': ['.txt']
  },
  maxSize = 10485760, // 10MB
  multiple = true,
}) => {
  const [isDragInvalid, setIsDragInvalid] = useState(false);
  const [isJustDragging, setIsJustDragging] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (disabled) return;

    if (rejectedFiles.length > 0) {
      setIsDragInvalid(true);
      return;
    }

    if (!multiple && acceptedFiles.length > 1) {
      setIsDragInvalid(true);
      return;
    }

    if (acceptedFiles.length > 0) {
      setIsDragInvalid(false);
      onFilesSelected(acceptedFiles);
    }
  }, [disabled, multiple, onFilesSelected]);

  const onDragEnter = useCallback(() => {
    setIsJustDragging(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsJustDragging(false);
  }, []);

  const { 
    getRootProps, 
    getInputProps, 
    isDragActive,
    isDragAccept,
    isDragReject
  } = useDropzone({
    onDrop,
    onDragEnter,
    onDragLeave,
    accept,
    maxSize,
    multiple,
    disabled,
  });

  const getStateClasses = () => {
    if (disabled) return 'opacity-50 cursor-not-allowed';
    if (isDragReject || isDragInvalid) return 'border-red-400 bg-red-50';
    if (isJustDragging || (isDragActive && !isDragAccept)) return 'border-blue-400 bg-blue-50';
    if (isDragAccept) return 'border-green-400 bg-green-50';
    return 'border-gray-300 hover:border-gray-400';
  };

  useEffect(() => {
    if (!isDragActive) {
      setIsJustDragging(false);
    }
  }, [isDragActive]);

  const renderMessage = () => {
    if (isDragActive) {
      return 'Drop files here...';
    }
    return 'Drag and drop files here, or click to select';
  };

  const renderError = () => {
    if (!isDragReject && !isDragInvalid) return null;

    return (
      <div className="absolute inset-0 flex items-center justify-center bg-red-50 bg-opacity-90 rounded-lg">
        <div className="text-red-500 font-medium">
          <X className="h-8 w-8 mx-auto mb-2" />
          Invalid file type or size
        </div>
      </div>
    );
  };

  return (
    <div
      {...getRootProps()}
      className={`
        relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
        transition-colors duration-200 ease-in-out
        ${getStateClasses()}
      `}
      role="presentation"
    >
      <input {...getInputProps()} />
      
      <Upload
        className={`mx-auto h-12 w-12 mb-4 ${
          isDragActive ? 'text-blue-500' : 'text-gray-400'
        }`}
      />

      <div className="text-sm">
        <p className="font-medium mb-1">
          {renderMessage()}
        </p>
        <p className="text-gray-500">
          Supported formats: PDF, HTML, TXT (max {(maxSize / 1024 / 1024).toFixed(0)}MB)
        </p>
      </div>

      {renderError()}
    </div>
  );
};

export default DocumentUpload;
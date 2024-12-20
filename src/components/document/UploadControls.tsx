// src/components/document/UploadControls.tsx
import React from 'react';
import { X, RefreshCw, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface UploadControlsProps {
  fileName: string;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  fileSize?: number;
  error?: string;
  onCancel?: () => void;
  onRetry?: () => void;
  onRemove?: () => void;
}

export const UploadControls: React.FC<UploadControlsProps> = ({
  fileName,
  status,
  progress,
  fileSize,
  error,
  onCancel,
  onRetry,
  onRemove,
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const getProgressBarColor = () => {
    switch (status) {
      case 'uploading':
        return 'bg-blue-500';
      case 'processing':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'uploading':
        return `Uploading... ${Math.round(progress)}%`;
      case 'processing':
        return 'Processing...';
      case 'completed':
        return 'Completed';
      case 'error':
        return error || 'Upload failed';
      default:
        return 'Pending';
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          {getStatusIcon()}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {fileName}
            </p>
            <p className="text-xs text-gray-500">
              {fileSize && formatFileSize(fileSize)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          <span className="text-xs text-gray-500">
            {getStatusText()}
          </span>
          
          {status === 'uploading' && onCancel && (
            <button
              onClick={onCancel}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              aria-label="Cancel upload"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {status === 'error' && onRetry && (
            <button
              onClick={onRetry}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              aria-label="Retry upload"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          {(status === 'completed' || status === 'error') && onRemove && (
            <button
              onClick={onRemove}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              aria-label="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-300 ${getProgressBarColor()}`}
          style={{ 
            width: `${status === 'completed' ? 100 : progress}%`,
            transition: 'width 0.3s ease-in-out'
          }}
        />
      </div>

      {error && status === 'error' && (
        <p className="mt-2 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
};

export default UploadControls;
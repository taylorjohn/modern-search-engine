// src/hooks/useDocumentUpload.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import { documentService } from '../services/document';
import { websocketService } from '../services/websocket';
import { logger } from '../services/logger';
import type { ProcessingStatus } from '../types/search';

interface UploadProgress {
  [key: string]: {
    progress: number;
    status: ProcessingStatus['status'];
    error?: string;
  };
}

interface UseDocumentUploadOptions {
  onUploadComplete?: (documentIds: string[]) => void;
  onProcessingComplete?: (documentId: string) => void;
  onError?: (error: Error, file?: File) => void;
  maxSize?: number;
  acceptedTypes?: string[];
}

export function useDocumentUpload({
  onUploadComplete,
  onProcessingComplete,
  onError,
  maxSize = 10 * 1024 * 1024, // 10MB
  acceptedTypes = ['application/pdf', 'text/plain', 'text/html']
}: UseDocumentUploadOptions = {}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>({});
  const uploadingRef = useRef(false);
  const statusSubscriptions = useRef(new Map<string, () => void>());

  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      statusSubscriptions.current.forEach(unsubscribe => unsubscribe());
      statusSubscriptions.current.clear();
    };
  }, []);

  // Subscribe to document processing status updates
  const subscribeToProcessingStatus = useCallback((documentId: string) => {
    const unsubscribe = websocketService.subscribeToProcessingUpdates(
      documentId,
      (status: ProcessingStatus) => {
        setProgress(prev => ({
          ...prev,
          [documentId]: {
            ...prev[documentId],
            status: status.status,
            error: status.error
          }
        }));

        if (status.status === 'completed') {
          onProcessingComplete?.(documentId);
          statusSubscriptions.current.get(documentId)?.();
          statusSubscriptions.current.delete(documentId);
        } else if (status.status === 'failed') {
          onError?.(new Error(status.error || 'Processing failed'), undefined);
        }
      }
    );

    statusSubscriptions.current.set(documentId, unsubscribe);
  }, [onProcessingComplete, onError]);

  // Validate files before upload
  const validateFiles = useCallback((files: File[]): File[] => {
    return files.filter(file => {
      if (file.size > maxSize) {
        onError?.(new Error(`File ${file.name} exceeds maximum size of ${maxSize} bytes`), file);
        return false;
      }
      if (!acceptedTypes.includes(file.type)) {
        onError?.(new Error(`File type ${file.type} is not supported`), file);
        return false;
      }
      return true;
    });
  }, [maxSize, acceptedTypes, onError]);

  // Handle file upload
  const uploadFiles = useCallback(async (files: File[]) => {
    if (uploadingRef.current) {
      logger.warn('Upload already in progress');
      return;
    }

    const validFiles = validateFiles(files);
    if (validFiles.length === 0) return;

    try {
      setUploading(true);
      uploadingRef.current = true;

      const uploadPromises = validFiles.map(async file => {
        setProgress(prev => ({
          ...prev,
          [file.name]: { progress: 0, status: 'pending' }
        }));

        try {
          const status = await documentService.uploadDocument(
            file,
            (progress) => {
              setProgress(prev => ({
                ...prev,
                [file.name]: {
                  ...prev[file.name],
                  progress
                }
              }));
            }
          );

          subscribeToProcessingStatus(status.id);
          return status.id;
        } catch (error) {
          setProgress(prev => ({
            ...prev,
            [file.name]: {
              ...prev[file.name],
              status: 'failed',
              error: error instanceof Error ? error.message : 'Upload failed'
            }
          }));
          throw error;
        }
      });

      const documentIds = await Promise.all(uploadPromises);
      onUploadComplete?.(documentIds);
    } catch (error) {
      if (error instanceof Error) {
        onError?.(error);
      }
    } finally {
      setUploading(false);
      uploadingRef.current = false;
    }
  }, [validateFiles, subscribeToProcessingStatus, onUploadComplete, onError]);

  // Cancel uploads and processing
  const cancel = useCallback(() => {
    uploadingRef.current = false;
    statusSubscriptions.current.forEach(unsubscribe => unsubscribe());
    statusSubscriptions.current.clear();
    setProgress({});
    setUploading(false);
  }, []);

  // Retry failed uploads
  const retry = useCallback(async (file: File) => {
    try {
      setProgress(prev => ({
        ...prev,
        [file.name]: { progress: 0, status: 'pending' }
      }));

      const status = await documentService.uploadDocument(
        file,
        (progress) => {
          setProgress(prev => ({
            ...prev,
            [file.name]: {
              ...prev[file.name],
              progress
            }
          }));
        }
      );

      subscribeToProcessingStatus(status.id);
      return status.id;
    } catch (error) {
      setProgress(prev => ({
        ...prev,
        [file.name]: {
          ...prev[file.name],
          status: 'failed',
          error: error instanceof Error ? error.message : 'Upload failed'
        }
      }));
      throw error;
    }
  }, [subscribeToProcessingStatus]);

  return {
    uploading,
    progress,
    uploadFiles,
    cancel,
    retry,
    validateFiles
  };
}
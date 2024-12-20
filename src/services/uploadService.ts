// src/services/uploadService.ts
export interface UploadProgress {
  uploadedBytes: number;
  totalBytes: number;
  percentage: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  fileName: string;
}

export interface UploadResponse {
  id: string;
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

class UploadService {
  private controller: AbortController | null = null;

  async uploadFile(
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResponse> {
    this.controller = new AbortController();
    const formData = new FormData();
    formData.append('file', file);

    try {
      let uploadedBytes = 0;
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        signal: this.controller.signal,
        onUploadProgress: (progressEvent: ProgressEvent) => {
          if (progressEvent.lengthComputable && onProgress) {
            uploadedBytes = progressEvent.loaded;
            onProgress({
              uploadedBytes: progressEvent.loaded,
              totalBytes: progressEvent.total,
              percentage: (progressEvent.loaded / progressEvent.total) * 100,
              status: 'uploading',
              fileName: file.name
            });
          }
        }
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (onProgress) {
        onProgress({
          uploadedBytes,
          totalBytes: file.size,
          percentage: 100,
          status: 'completed',
          fileName: file.name
        });
      }

      return result;
    } catch (error) {
      if (onProgress) {
        onProgress({
          uploadedBytes: 0,
          totalBytes: file.size,
          percentage: 0,
          status: 'error',
          fileName: file.name
        });
      }
      throw error;
    }
  }

  cancelUpload() {
    if (this.controller) {
      this.controller.abort();
      this.controller = null;
    }
  }

  retryUpload(file: File, onProgress?: (progress: UploadProgress) => void) {
    return this.uploadFile(file, onProgress);
  }
}

export const uploadService = new UploadService();
// src/services/document.ts
import type { ProcessingStatus } from '../types/search';

class DocumentService {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  public async uploadDocument(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<ProcessingStatus> {
    const formData = new FormData();
    formData.append('file', file);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('Invalid response format'));
          }
        } else {
          reject(new Error('Upload failed'));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error'));
      });

      xhr.open('POST', `${this.baseUrl}/upload`);
      xhr.send(formData);
    });
  }

  public async getProcessingStatus(documentId: string): Promise<ProcessingStatus> {
    return this.request<ProcessingStatus>(`/documents/${documentId}/status`);
  }

  public async bulkUpload(
    files: File[],
    onProgress?: (fileId: string, progress: number) => void
  ): Promise<ProcessingStatus[]> {
    const uploadPromises = files.map(file => this.uploadDocument(file, 
      progress => onProgress?.(file.name, progress)
    ));
    
    return Promise.all(uploadPromises);
  }

  public async deleteDocument(documentId: string): Promise<void> {
    await this.request(`/documents/${documentId}`, {
      method: 'DELETE',
    });
  }

  public async updateDocument(
    documentId: string,
    updates: {
      title?: string;
      tags?: string[];
      metadata?: Record<string, any>;
    }
  ): Promise<ProcessingStatus> {
    return this.request<ProcessingStatus>(`/documents/${documentId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
  }

  public async reprocessDocument(documentId: string): Promise<ProcessingStatus> {
    return this.request<ProcessingStatus>(`/documents/${documentId}/reprocess`, {
      method: 'POST',
    });
  }
}

export const documentService = new DocumentService();
// src/services/api.ts

import { mockApi } from './mockApi';

const USE_MOCK_API = true; // Toggle this to switch between mock and real API

class ApiService {
  private baseUrl = 'http://localhost:3030/api';

  async search(query: string) {
    if (USE_MOCK_API) {
      return mockApi.search(query);
    }

    const response = await fetch(`${this.baseUrl}/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error('Search failed');
    }
    return response.json();
  }

  async upload(file: File) {
    if (USE_MOCK_API) {
      return mockApi.upload(file);
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/documents`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }
    return response.json();
  }

  async getProcessingStatus(id: string) {
    if (USE_MOCK_API) {
      return mockApi.processingStatus(id);
    }

    const response = await fetch(`${this.baseUrl}/documents/status/${id}`);
    if (!response.ok) {
      throw new Error('Failed to get processing status');
    }
    return response.json();
  }
}

export const api = new ApiService();
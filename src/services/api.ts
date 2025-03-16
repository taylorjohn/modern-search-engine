// src/services/api.ts

import { mockApi } from '@/services/mockApi';
import { errorService, ErrorType } from '@/services/errorService';
import { logger } from '@/services/logger';

/**
 * Configuration options for the API service
 */
interface ApiConfig {
  /** Base URL for API requests */
  baseUrl: string;
  /** Whether to use mock API instead of real backend */
  useMock: boolean;
  /** Default timeout for requests in milliseconds */
  timeout: number;
  /** Whether to automatically retry failed requests */
  autoRetry: boolean;
  /** Maximum number of retry attempts */
  maxRetries: number;
}

/**
 * Default configuration for API
 */
const DEFAULT_CONFIG: ApiConfig = {
  baseUrl: process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3030/api'
    : '/api',
  useMock: process.env.NODE_ENV === 'development' ? true : false,
  timeout: 30000, // 30 seconds
  autoRetry: true,
  maxRetries: 3
};

/**
 * Service for handling API requests to the backend
 */
class ApiService {
  private config: ApiConfig;
  private activeRequests: Map<string, AbortController> = new Map();

  /**
   * Creates a new API service instance
   * @param config - Configuration options
   */
  constructor(config: Partial<ApiConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    logger.info('API Service initialized', { 
      baseUrl: this.config.baseUrl, 
      useMock: this.config.useMock 
    });
  }

  /**
   * Core method to make API requests with standardized error handling and retries
   * @param endpoint - API endpoint to request
   * @param options - Request options
   * @param requestId - Optional unique ID for the request (for cancellation)
   * @returns Response data from API
   * @private
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit & {
      params?: Record<string, string>;
      retryCount?: number;
      timeout?: number;
    } = {},
    requestId?: string
  ): Promise<T> {
    // Extract and process options
    const {
      params,
      retryCount = 0,
      timeout = this.config.timeout,
      ...fetchOptions
    } = options;

    // Build URL with query parameters
    let url = `${this.config.baseUrl}${endpoint}`;
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value);
        }
      });
      url += `?${searchParams.toString()}`;
    }

    // Create abort controller for this request
    const controller = new AbortController();
    if (requestId) {
      // Cancel previous request with same ID if exists
      this.cancelRequest(requestId);
      this.activeRequests.set(requestId, controller);
    }

    // Set up timeout
    const timeoutId = setTimeout(() => {
      controller.abort();
      logger.warn(`Request to ${endpoint} timed out after ${timeout}ms`);
    }, timeout);

    try {
      logger.debug(`API Request: ${options.method || 'GET'} ${url}`, {
        params,
        retryCount,
      });

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
      });

      // Clean up after request completes
      clearTimeout(timeoutId);
      if (requestId) {
        this.activeRequests.delete(requestId);
      }

      // Handle error responses
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { message: 'Unknown error occurred' };
        }

        const error = {
          status: response.status,
          statusText: response.statusText,
          data: errorData,
          message: errorData.message || `Request failed with status ${response.status}`,
        };

        logger.error(`API Error: ${error.message}`, { endpoint, status: response.status });

        // Retry logic for certain status codes if auto-retry is enabled
        if (
          this.config.autoRetry &&
          retryCount < this.config.maxRetries &&
          [408, 429, 500, 502, 503, 504].includes(response.status)
        ) {
          const nextRetryCount = retryCount + 1;
          const delay = this.getRetryDelay(nextRetryCount);

          logger.info(`Retrying request to ${endpoint} (attempt ${nextRetryCount})`, {
            delay,
            status: response.status,
          });

          await new Promise(resolve => setTimeout(resolve, delay));

          return this.request<T>(endpoint, {
            ...options,
            retryCount: nextRetryCount,
          }, requestId);
        }

        throw errorService.handleError(error, ErrorType.API);
      }

      // Parse successful response
      return await response.json();
    } catch (error) {
      // Clean up on error
      clearTimeout(timeoutId);
      if (requestId) {
        this.activeRequests.delete(requestId);
      }

      // Handle abort error
      if (error.name === 'AbortError') {
        throw errorService.handleError({
          message: 'Request was cancelled',
          type: ErrorType.API,
          code: 'REQUEST_CANCELLED',
        });
      }

      // Re-throw processed error
      throw error;
    }
  }

  /**
   * Cancels an active request by ID
   * @param requestId - ID of the request to cancel
   */
  public cancelRequest(requestId: string): void {
    const controller = this.activeRequests.get(requestId);
    if (controller) {
      controller.abort();
      this.activeRequests.delete(requestId);
      logger.debug(`Cancelled request: ${requestId}`);
    }
  }

  /**
   * Calculates delay for retry attempts using exponential backoff
   * @param retryCount - Current retry attempt number
   * @returns Delay in milliseconds
   * @private
   */
  private getRetryDelay(retryCount: number): number {
    return Math.min(
      1000 * Math.pow(2, retryCount) + Math.random() * 1000,
      10000 // Max 10 seconds
    );
  }

  /**
   * Searches for documents matching the given query
   * @param query - Search query string
   * @param filters - Optional search filters
   * @returns Promise with search results
   */
  async search(query: string, filters = {}) {
    // Use mock API if configured
    if (this.config.useMock) {
      return mockApi.search(query);
    }

    return this.request('/search', {
      params: { 
        q: query,
        ...filters
      }
    }, 'search');
  }

  /**
   * Uploads a document file for processing
   * @param file - File to upload
   * @param metadata - Optional metadata about the file
   * @returns Promise with upload result
   */
  async upload(file: File, metadata = {}) {
    // Use mock API if configured
    if (this.config.useMock) {
      return mockApi.upload(file);
    }

    const formData = new FormData();
    formData.append('file', file);
    
    // Add metadata fields to formData
    Object.entries(metadata).forEach(([key, value]) => {
      formData.append(key, JSON.stringify(value));
    });

    // Create unique request ID based on file name and size
    const requestId = `upload-${file.name}-${file.size}`;

    return this.request('/documents', {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header as browser will set it with boundary for FormData
      headers: {},
    }, requestId);
  }

  /**
   * Gets the processing status of a document
   * @param id - Document ID to check status for
   * @returns Promise with processing status
   */
  async getProcessingStatus(id: string) {
    // Use mock API if configured
    if (this.config.useMock) {
      return mockApi.processingStatus(id);
    }

    return this.request(`/documents/status/${id}`);
  }

  /**
   * Gets document details by ID
   * @param id - Document ID to retrieve
   * @returns Promise with document details
   */
  async getDocument(id: string) {
    // Use mock API if configured
    if (this.config.useMock) {
      return mockApi.getDocument(id);
    }

    return this.request(`/documents/${id}`);
  }

  /**
   * Gets a list of documents matching criteria
   * @param options - Query options like pagination, sorting
   * @returns Promise with list of documents
   */
  async getDocuments(options = {}) {
    // Use mock API if configured
    if (this.config.useMock) {
      return mockApi.getDocuments();
    }

    return this.request('/documents', { params: options as any });
  }

  /**
   * Gets document content for display
   * @param id - Document ID to retrieve content for
   * @returns Promise with document content
   */
  async getDocumentContent(id: string) {
    // Use mock API if configured
    if (this.config.useMock) {
      return mockApi.getDocumentContent(id);
    }

    return this.request(`/documents/${id}/content`);
  }
  
  /**
   * Deletes a document by ID
   * @param id - Document ID to delete
   * @returns Promise with deletion result
   */
  async deleteDocument(id: string) {
    // Use mock API if configured
    if (this.config.useMock) {
      return mockApi.deleteDocument(id);
    }

    return this.request(`/documents/${id}`, {
      method: 'DELETE'
    });
  }

  /**
   * Gets suggestions based on a partial query
   * @param partialQuery - Partial search query
   * @returns Promise with search suggestions
   */
  async getSuggestions(partialQuery: string) {
    // Use mock API if configured
    if (this.config.useMock) {
      return mockApi.getSuggestions(partialQuery);
    }

    return this.request('/suggestions', {
      params: { q: partialQuery }
    }, 'suggestions');
  }
}

/**
 * Configure API service with environment-specific settings
 */
export const api = new ApiService();
// src/services/search.ts
import type { SearchResult, SearchFilters, SearchStats } from '@/types/search';
import { errorService, ErrorType } from '@/services/errorService';

/**
 * Service for managing search functionality with the backend API
 * Handles search requests, filtering, result processing, and analytics
 */
class SearchService {
  private baseUrl: string;
  private controller: AbortController | null = null;

  /**
   * Creates a new SearchService instance
   * @param baseUrl - Base URL for the API (defaults to '/api')
   */
  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * Generic method for making API requests
   * @param endpoint - API endpoint to request
   * @param options - Fetch options
   * @returns Promise resolving to the response data
   * @private
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  /**
   * Cancels any in-progress search request
   */
  public cancelCurrentSearch() {
    if (this.controller) {
      this.controller.abort();
      this.controller = null;
    }
  }

  /**
   * Performs a search with the given query and filters
   * @param query - Search query string
   * @param filters - Optional filters to apply to the search
   * @param options - Additional options for the request
   * @returns Promise resolving to search results with metadata
   */
  public async search(
    query: string,
    filters?: SearchFilters,
    options: { signal?: AbortSignal } = {}
  ): Promise<{ results: SearchResult[]; total: number; executionTime: number }> {
    this.cancelCurrentSearch();
    this.controller = new AbortController();

    const searchParams = new URLSearchParams({
      q: query,
      ...(filters?.contentTypes?.length ? { types: filters.contentTypes.join(',') } : {}),
      ...(filters?.authors?.length ? { authors: filters.authors.join(',') } : {}),
      ...(filters?.dateRange?.from ? { from: filters.dateRange.from.toISOString() } : {}),
      ...(filters?.dateRange?.to ? { to: filters.dateRange.to.toISOString() } : {}),
    });

    try {
      const startTime = performance.now();
      const response = await this.request<{ results: SearchResult[]; total: number }>(
        `/search?${searchParams.toString()}`,
        {
          signal: this.controller.signal
        }
      );
      const executionTime = performance.now() - startTime;

      return { ...response, executionTime };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw { 
          type: ErrorType.SEARCH, 
          message: 'Search cancelled',
          originalError: error
        };
      }
      
      // Use the error service to standardize errors
      throw errorService.handleError(error, ErrorType.SEARCH);
    }
  }

  /**
   * Retrieves documents similar to the specified document
   * @param documentId - ID of the document to find similarities for
   * @returns Promise resolving to an array of similar search results
   */
  public async getSimilarDocuments(documentId: string): Promise<SearchResult[]> {
    return this.request<SearchResult[]>(`/similar/${documentId}`);
  }

  /**
   * Retrieves search statistics for analytics
   * @param timeRange - Optional date range to filter stats
   * @returns Promise resolving to search statistics
   */
  public async getSearchStats(timeRange?: { from: Date; to: Date }): Promise<SearchStats> {
    const params = new URLSearchParams();
    if (timeRange) {
      params.set('from', timeRange.from.toISOString());
      params.set('to', timeRange.to.toISOString());
    }

    return this.request<SearchStats>(`/stats?${params.toString()}`);
  }

  /**
   * Generates a vector embedding for the given text
   * Used for semantic search capabilities
   * @param text - Text to generate an embedding for
   * @returns Promise resolving to a vector embedding (array of numbers)
   */
  public async generateEmbedding(text: string): Promise<number[]> {
    return this.request<number[]>('/embed', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  /**
   * Computes similarity between two embeddings
   * @param embedding1 - First vector embedding
   * @param embedding2 - Second vector embedding
   * @returns Promise resolving to a similarity score (0-1)
   */
  public async computeSimilarity(embedding1: number[], embedding2: number[]): Promise<number> {
    return this.request<number>('/similarity', {
      method: 'POST',
      body: JSON.stringify({ embedding1, embedding2 }),
    });
  }
}

export const searchService = new SearchService();
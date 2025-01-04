// src/services/search.ts
import type { SearchResult, SearchFilters, SearchStats } from '../types/search';

class SearchService {
  private baseUrl: string;
  private controller: AbortController | null = null;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

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

  public cancelCurrentSearch() {
    if (this.controller) {
      this.controller.abort();
      this.controller = null;
    }
  }

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
        throw new Error('Search cancelled');
      }
      throw error;
    }
  }

  public async getSimilarDocuments(documentId: string): Promise<SearchResult[]> {
    return this.request<SearchResult[]>(`/similar/${documentId}`);
  }

  public async getSearchStats(timeRange?: { from: Date; to: Date }): Promise<SearchStats> {
    const params = new URLSearchParams();
    if (timeRange) {
      params.set('from', timeRange.from.toISOString());
      params.set('to', timeRange.to.toISOString());
    }

    return this.request<SearchStats>(`/stats?${params.toString()}`);
  }

  public async generateEmbedding(text: string): Promise<number[]> {
    return this.request<number[]>('/embed', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  public async computeSimilarity(embedding1: number[], embedding2: number[]): Promise<number> {
    return this.request<number>('/similarity', {
      method: 'POST',
      body: JSON.stringify({ embedding1, embedding2 }),
    });
  }
}

export const searchService = new SearchService();
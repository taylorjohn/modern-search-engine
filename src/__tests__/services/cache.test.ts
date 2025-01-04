// src/__tests__/services/cache.test.ts
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { cacheService } from '../../services/cache';
import type { SearchResult, SearchFilters } from '../../types/search';

describe('CacheService', () => {
  const mockSearchResult: SearchResult = {
    id: '1',
    title: 'Test Document',
    content: 'Test content',
    scores: {
      textScore: 0.8,
      vectorScore: 0.9,
      finalScore: 0.85
    },
    metadata: {
      author: 'Test Author',
      created: '2024-01-01',
      wordCount: 100,
      type: 'document'
    },
    tags: ['test']
  };

  const mockFilters: SearchFilters = {
    contentTypes: ['pdf'],
    dateRange: { from: null, to: null },
    authors: []
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    cacheService.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should store and retrieve items', () => {
    cacheService.set('test-key', mockSearchResult);
    expect(cacheService.get('test-key')).toEqual(mockSearchResult);
  });

  it('should handle vector embeddings with longer TTL', () => {
    const embedding = [0.1, 0.2, 0.3];
    cacheService.setVectorEmbedding('test text', embedding);

    // Check immediately
    expect(cacheService.getVectorEmbedding('test text')).toEqual(embedding);

    // Check after default TTL
    vi.advanceTimersByTime(6 * 60 * 60 * 1000); // 6 hours
    expect(cacheService.getVectorEmbedding('test text')).toEqual(embedding);

    // Check after vector TTL
    vi.advanceTimersByTime(24 * 60 * 60 * 1000); // 24 hours
    expect(cacheService.getVectorEmbedding('test text')).toBeNull();
  });

  it('should respect max cache size', () => {
    // Fill cache to max size
    for (let i = 0; i < 1001; i++) {
      cacheService.set(`key-${i}`, { data: i });
    }

    // Check that oldest entry was evicted
    expect(cacheService.get('key-0')).toBeNull();
    expect(cacheService.get('key-1000')).not.toBeNull();

    // Verify cache stats
    const stats = cacheService.getStats();
    expect(stats.size).toBeLessThanOrEqual(1000);
  });

  it('should handle search query caching with filters', () => {
    const query1 = 'test query';
    const query2 = 'test query';
    const filters1 = { ...mockFilters };
    const filters2 = { ...mockFilters, contentTypes: ['html'] };

    cacheService.setSearchResults(query1, filters1, [mockSearchResult]);
    cacheService.setSearchResults(query2, filters2, [{ ...mockSearchResult, id: '2' }]);

    // Different filters should result in different cache entries
    expect(cacheService.getSearchResults(query1, filters1)?.[0].id).toBe('1');
    expect(cacheService.getSearchResults(query2, filters2)?.[0].id).toBe('2');
  });

  it('should handle cache cleaning and stats', () => {
    cacheService.set('expired1', 'data1', 1000);
    cacheService.set('expired2', 'data2', 2000);
    cacheService.set('valid', 'data3', 5000);

    vi.advanceTimersByTime(3000);

    const deletedCount = cacheService.cleanExpired();
    expect(deletedCount).toBe(2);

    const stats = cacheService.getStats();
    expect(stats.size).toBe(1);
  });

  it('should track hit and miss rates', () => {
    cacheService.set('key1', 'data1');
    
    // Generate some hits
    cacheService.get('key1');
    cacheService.get('key1');
    
    // Generate some misses
    cacheService.get('nonexistent1');
    cacheService.get('nonexistent2');

    const stats = cacheService.getStats();
    expect(stats.hitRate).toBe(0.5); // 2 hits out of 4 attempts
    expect(stats.missRate).toBe(0.5); // 2 misses out of 4 attempts
  });

  it('should handle complex cache keys correctly', () => {
    const complexKey = {
      query: 'test',
      filters: {
        contentTypes: ['pdf', 'html'],
        authors: ['John', 'Jane'],
        dateRange: { from: new Date(), to: new Date() }
      }
    };

    cacheService.set(complexKey, 'data');
    expect(cacheService.get(complexKey)).toBe('data');
  });

  it('should handle cache invalidation', () => {
    // Set up some cached data
    cacheService.set('key1', 'data1');
    cacheService.set('key2', 'data2');

    // Delete specific cache entry
    cacheService.delete('key1');
    expect(cacheService.get('key1')).toBeNull();
    expect(cacheService.get('key2')).toBe('data2');

    // Clear all cache
    cacheService.clear();
    expect(cacheService.get('key2')).toBeNull();
  });

  it('should calculate average age of cache entries', () => {
    cacheService.set('key1', 'data1');
    vi.advanceTimersByTime(1000);
    cacheService.set('key2', 'data2');
    vi.advanceTimersByTime(1000);

    const stats = cacheService.getStats();
    expect(stats.averageAge).toBe(1500); // (2000 + 1000) / 2
  });

  it('should handle concurrent cache operations', async () => {
    const promises = [];
    for (let i = 0; i < 100; i++) {
      promises.push(
        Promise.resolve().then(() => {
          cacheService.set(`key-${i}`, `data-${i}`);
          return cacheService.get(`key-${i}`);
        })
      );
    }

    const results = await Promise.all(promises);
    expect(results.every(result => result !== null)).toBe(true);
  });

  it('should handle type safety with generics', () => {
    interface TestType {
      id: number;
      name: string;
    }

    const testData: TestType = { id: 1, name: 'test' };
    cacheService.set<TestType>('test-key', testData);
    
    const retrieved = cacheService.get<TestType>('test-key');
    expect(retrieved?.id).toBe(1);
    expect(retrieved?.name).toBe('test');
  });

  it('should handle cache entry updates', () => {
    cacheService.set('key', 'initial value');
    cacheService.set('key', 'updated value');

    expect(cacheService.get('key')).toBe('updated value');
    
    const stats = cacheService.getStats();
    expect(stats.size).toBe(1); // Should not create duplicate entries
  });

  it('should handle cache presence check', () => {
    cacheService.set('key', 'value', 1000);
    
    expect(cacheService.has('key')).toBe(true);
    expect(cacheService.has('nonexistent')).toBe(false);

    vi.advanceTimersByTime(1001);
    expect(cacheService.has('key')).toBe(false);
  });
});
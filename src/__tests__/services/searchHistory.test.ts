// src/__tests__/services/searchHistory.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { searchHistoryService } from '../../services/searchHistory';

describe('SearchHistoryService', () => {
  beforeEach(() => {
    localStorage.clear();
    searchHistoryService.clear();
  });

  it('filters history by date range', () => {
    const now = new Date('2024-01-03T12:00:00Z').getTime();
    const yesterday = new Date('2024-01-02T12:00:00Z').getTime();
    const twoDaysAgo = new Date('2024-01-01T12:00:00Z').getTime();

    searchHistoryService.add({
      query: 'test query 3',
      results: 3,
      timestamp: twoDaysAgo,
      filters: { contentTypes: [], authors: [] }
    });

    searchHistoryService.add({
      query: 'test query 2',
      results: 5,
      timestamp: yesterday,
      filters: { contentTypes: [], authors: [] }
    });

    searchHistoryService.add({
      query: 'test query 1',
      results: 10,
      timestamp: now,
      filters: { contentTypes: [], authors: [] }
    });

    const filtered = searchHistoryService.filterByDateRange(
      new Date('2024-01-02T00:00:00Z'),
      new Date('2024-01-03T23:59:59Z')
    );

    expect(filtered).toHaveLength(2);
    expect(filtered[0].query).toBe('test query 1'); // Most recent first
    expect(filtered[1].query).toBe('test query 2');
  });
});
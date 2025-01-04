// src/__tests__/services/searchHistory.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { searchHistoryService } from '@/services/searchHistory';

describe('SearchHistoryService', () => {
  beforeEach(() => {
    localStorage.clear();
    searchHistoryService.clear();
  });

  it('filters history by date range', () => {
    // Use fixed dates to avoid timezone issues
    const date3 = new Date('2024-01-03T12:00:00Z');
    const date2 = new Date('2024-01-02T12:00:00Z');
    const date1 = new Date('2024-01-01T12:00:00Z');

    searchHistoryService.add({
      query: 'test query 1',
      results: 10,
      timestamp: date3.getTime(),
      filters: { contentTypes: [], authors: [] }
    });

    searchHistoryService.add({
      query: 'test query 2',
      results: 5,
      timestamp: date2.getTime(),
      filters: { contentTypes: [], authors: [] }
    });

    searchHistoryService.add({
      query: 'test query 3',
      results: 3,
      timestamp: date1.getTime(),
      filters: { contentTypes: [], authors: [] }
    });

    const filtered = searchHistoryService.filterByDateRange(date2, date3);
    expect(filtered).toHaveLength(2);
    expect(filtered[0].query).toBe('test query 1');
    expect(filtered[1].query).toBe('test query 2');
  });
});
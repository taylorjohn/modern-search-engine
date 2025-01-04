// src/__tests__/integration/searchHistory.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { searchHistoryService } from '../../services/searchHistory';
import type { SearchHistoryItem } from '../../services/searchHistory';

describe('SearchHistoryService', () => {
  beforeEach(() => {
    localStorage.clear();
    searchHistoryService.clear();
  });

  it('filters history by date range', () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    
    const items: SearchHistoryItem[] = [
      {
        query: 'test query 3',
        results: 3,
        timestamp: twoDaysAgo.getTime(),
        filters: { contentTypes: [], authors: [] }
      },
      {
        query: 'test query 2',
        results: 5,
        timestamp: yesterday.getTime(),
        filters: { contentTypes: [], authors: [] }
      },
      {
        query: 'test query 1',
        results: 10,
        timestamp: now.getTime(),
        filters: { contentTypes: [], authors: [] }
      }
    ];

    // Add items in reverse order to match the unshift behavior
    items.reverse().forEach(item => searchHistoryService.add(item));

    const filtered = searchHistoryService.filterByDateRange(yesterday, now);
    expect(filtered).toHaveLength(2);
    expect(filtered[0].query).toBe('test query 1');
    expect(filtered[1].query).toBe('test query 2');
  });
});
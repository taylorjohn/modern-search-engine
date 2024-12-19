// src/__tests__/integration/document-processor.test.ts
import { describe, it, expect } from 'vitest';
import { mockSearch } from '../../mockData';

describe('Document Processor', () => {
  it('returns search results in correct format', async () => {
    const results = await mockSearch('test query');
    
    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
    
    if (results.length > 0) {
      const firstResult = results[0];
      expect(firstResult).toHaveProperty('id');
      expect(firstResult).toHaveProperty('title');
      expect(firstResult).toHaveProperty('content');
      expect(firstResult).toHaveProperty('scores');
      expect(firstResult.scores).toHaveProperty('textScore');
      expect(firstResult.scores).toHaveProperty('vectorScore');
      expect(firstResult.scores).toHaveProperty('finalScore');
    }
  });
});
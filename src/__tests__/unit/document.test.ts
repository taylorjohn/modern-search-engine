// src/__tests__/unit/document.test.ts
import { describe, it, expect } from 'vitest'
import { MockDocument } from '../../mockData'

describe('Document Type', () => {
  it('validates document structure', () => {
    const testDoc: MockDocument = {
      id: '1',
      title: 'Test Document',
      content: 'Test content',
      documentType: 'pdf',
      scores: {
        textScore: 0.9,
        vectorScore: 0.8,
        finalScore: 0.85
      },
      metadata: {
        author: 'Test Author',
        created: '2024-01-01',
        wordCount: 100,
        type: 'test'
      },
      tags: ['test']
    }

    expect(testDoc).toHaveProperty('id')
    expect(testDoc).toHaveProperty('title')
    expect(testDoc).toHaveProperty('content')
    expect(testDoc.scores.finalScore).toBeLessThanOrEqual(1)
    expect(testDoc.scores.finalScore).toBeGreaterThanOrEqual(0)
  })
})
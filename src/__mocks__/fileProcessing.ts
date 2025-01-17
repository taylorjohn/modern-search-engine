import { vi } from 'vitest';

export interface ProcessedDocument {
  id: string;
  content: string;
  metadata: {
    filename: string;
    type: string;
    size: number;
    created: string;
    words: number;
  };
}

export const mockDocuments: ProcessedDocument[] = [];

const defaultDoc: ProcessedDocument = {
  id: '1',
  content: 'Test content',
  metadata: {
    filename: 'test.txt',
    type: 'text/plain',
    size: 100,
    created: new Date().toISOString(),
    words: 100
  }
};

export const processFile = vi.fn().mockImplementation(async (file: File, onProgress: (progress: number) => void) => {
  onProgress(100);
  const doc = {
    ...defaultDoc,
    metadata: { ...defaultDoc.metadata, filename: file.name }
  };
  mockDocuments.push(doc);
  return doc;
});

export const searchDocuments = vi.fn().mockImplementation((query: string) => {
  if (query === 'test') {
    return [defaultDoc];
  }
  return [];
});

export const getProcessedDocuments = vi.fn().mockReturnValue([]);

export const clearProcessedDocuments = vi.fn().mockImplementation(() => {
  mockDocuments.length = 0;
});
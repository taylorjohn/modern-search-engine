// src/__tests__/services/fileProcessing.test.ts
import { describe, it, expect, vi } from 'vitest';
import { processFile } from '../../services/fileProcessing';

describe('File Processing Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('processes text files correctly', async () => {
    const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const result = await processFile(mockFile);
    expect(result.content).toBe('test content');
  });

  it('processes PDF files correctly', async () => {
    const mockFile = new File(['PDF content'], 'test.pdf', { type: 'application/pdf' });
    const result = await processFile(mockFile);
    expect(result.processed).toBe(true);
  });

  it('rejects unsupported file types', async () => {
    const mockFile = new File(['image data'], 'test.jpg', { type: 'image/jpeg' });
    await expect(processFile(mockFile)).rejects.toThrow('Unsupported file type');
  });

  it('handles empty files', async () => {
    const mockFile = new File([''], 'empty.txt', { type: 'text/plain' });
    const result = await processFile(mockFile);
    expect(result.content).toBe('');
  });

  it('processes large files in chunks', async () => {
    const largeContent = 'x'.repeat(1024 * 1024); // 1MB of content
    const mockFile = new File([largeContent], 'large.txt', { type: 'text/plain' });
    const result = await processFile(mockFile);
    expect(result.size).toBe(largeContent.length);
  });
});
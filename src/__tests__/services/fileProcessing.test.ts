// src/__tests__/services/fileProcessing.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { processFile } from '@/services';

// Mock FileReader
class MockFileReader {
  onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  readAsText(file: Blob) {
    setTimeout(() => {
      if (this.onload) {
        this.onload.call(this, {
          target: { result: file.size === 0 ? '' : 'test content' }
        } as any);
      }
    }, 0);
  }
  readAsArrayBuffer(file: Blob) {
    setTimeout(() => {
      if (this.onload) {
        this.onload.call(this, {
          target: { result: new ArrayBuffer(file.size) }
        } as any);
      }
    }, 0);
  }
}

// Mock the global FileReader
(global as any).FileReader = MockFileReader;

describe('File Processing Service', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('processes text files correctly', async () => {
    const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const progressCallback = vi.fn();
    
    const processPromise = processFile(mockFile, progressCallback);
    await vi.runAllTimersAsync();
    const result = await processPromise;

    expect(result.content).toBe('test content');
    expect(result.processed).toBe(true);
    expect(result.type).toBe('text/plain');
    expect(progressCallback).toHaveBeenCalledWith(100);
  });

  it('processes PDF files correctly', async () => {
    const mockFile = new File([new ArrayBuffer(10)], 'test.pdf', { type: 'application/pdf' });
    const progressCallback = vi.fn();
    
    const processPromise = processFile(mockFile, progressCallback);
    await vi.runAllTimersAsync();
    const result = await processPromise;

    expect(result.processed).toBe(true);
    expect(result.type).toBe('application/pdf');
    expect(result.size).toBe(10);
    expect(progressCallback).toHaveBeenCalledWith(100);
  });

  it('rejects unsupported file types', async () => {
    const mockFile = new File(['image data'], 'test.jpg', { type: 'image/jpeg' });
    await expect(processFile(mockFile)).rejects.toThrow('Unsupported file type');
  });

  it('handles empty files', async () => {
    const mockFile = new File([], 'empty.txt', { type: 'text/plain' });
    const progressCallback = vi.fn();
    
    const processPromise = processFile(mockFile, progressCallback);
    await vi.runAllTimersAsync();
    const result = await processPromise;

    expect(result.content).toBe('');
    expect(result.size).toBe(0);
    expect(progressCallback).toHaveBeenCalledWith(100);
  });

  it('processes large files in chunks', async () => {
    const largeContent = 'x'.repeat(1024 * 1024); // 1MB of content
    const mockFile = new File([largeContent], 'large.txt', { type: 'text/plain' });
    const progressCallback = vi.fn();
    
    const processPromise = processFile(mockFile, progressCallback);
    await vi.runAllTimersAsync();
    const result = await processPromise;

    expect(result.size).toBe(largeContent.length);
    expect(progressCallback).toHaveBeenCalledWith(100);
  });
});
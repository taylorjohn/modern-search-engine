import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock FileReader
class MockFileReader {
  onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  result: string | ArrayBuffer | null = null;

  readAsText(file: Blob) {
    queueMicrotask(() => {
      this.result = 'test content';
      this.onload?.call(this, { target: { result: 'test content' } } as any);
    });
  }
}

global.FileReader = MockFileReader as any;

// Mock react-dropzone
vi.mock('react-dropzone', () => {
  const onDrop = vi.fn();
  return {
    useDropzone: vi.fn(() => ({
      getRootProps: () => ({
        'data-testid': 'dropzone',
        onClick: vi.fn()
      }),
      getInputProps: () => ({
        'data-testid': 'file-input'
      }),
      isDragActive: false,
      isDragReject: false,
      onDrop
    }))
  };
});
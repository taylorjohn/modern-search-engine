import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock react-dropzone
vi.mock('react-dropzone', () => ({
  useDropzone: vi.fn(() => ({
    getRootProps: () => ({
      'data-testid': 'dropzone'
    }),
    getInputProps: () => ({
      'data-testid': 'file-input'
    }),
    isDragActive: false,
    isDragReject: false,
    onDrop: vi.fn()
  }))
}));

// Mock FileReader
class MockFileReader {
  onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  result: string | ArrayBuffer | null = null;

  readAsText(file: Blob) {
    setTimeout(() => {
      this.result = 'Mock file content';
      this.onload?.call(this, new ProgressEvent('load'));
    }, 0);
  }
}

global.FileReader = MockFileReader as any;

// Mock window.fs
vi.stubGlobal('fs', {
  readFile: vi.fn().mockResolvedValue(new Uint8Array(Buffer.from('test content'))),
  writeFile: vi.fn().mockResolvedValue(undefined)
});
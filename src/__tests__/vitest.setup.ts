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
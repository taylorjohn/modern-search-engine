import { vi } from 'vitest';

const defaultMockImplementation = ({ onDrop = vi.fn() } = {}) => ({
  getRootProps: () => ({
    onClick: vi.fn(),
    'data-testid': 'dropzone',
    onDrop: (e: any) => {
      e.preventDefault();
      const files = e.dataTransfer?.files;
      if (files?.length) {
        onDrop(Array.from(files));
      }
    }
  }),
  getInputProps: () => ({
    accept: 'application/pdf,.pdf,text/plain,.txt',
  }),
  isDragActive: false,
  isDragReject: false,
  fileRejections: []
});

export const useDropzone = vi.fn(defaultMockImplementation);
useDropzone.mockImplementation = (impl: any) => {
  useDropzone.mockReset().mockImplementation(impl);
};
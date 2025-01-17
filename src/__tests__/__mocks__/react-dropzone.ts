import React from 'react';
import { vi } from 'vitest';

export const useDropzone = vi.fn(({ onDrop, accept }) => ({
  getRootProps: () => ({
    onClick: vi.fn(),
    onDrop: (event) => {
      event.preventDefault();
      const files = event.dataTransfer?.files;
      if (!files?.length) return;

      const acceptedFiles = Array.from(files).filter(file => {
        if (!accept) return true;
        return Object.keys(accept).some(type => 
          accept[type].some(ext => file.name.toLowerCase().endsWith(ext))
        );
      });

      if (acceptedFiles.length > 0) {
        onDrop(acceptedFiles);
      }
    },
    'data-testid': 'dropzone',
  }),
  getInputProps: () => ({
    type: 'file',
    accept: accept ? Object.keys(accept).join(',') : undefined,
  }),
  isDragActive: false,
  isDragReject: false,
  fileRejections: [],
}));
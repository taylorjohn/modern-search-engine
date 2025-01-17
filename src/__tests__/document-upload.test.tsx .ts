import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DocumentUpload from '../../components/document/DocumentUpload';

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
    isDragReject: false
  }))
}));

describe('DocumentUpload Component', () => {
  it('renders upload area correctly', () => {
    render(<DocumentUpload onFilesSelected={() => {}} />);
    expect(screen.getByTestId('dropzone')).toBeInTheDocument();
    expect(screen.getByTestId('file-input')).toBeInTheDocument();
  });

  it('handles file upload correctly', () => {
    const mockOnFilesSelected = vi.fn();
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    
    const { useDropzone } = require('react-dropzone');
    useDropzone.mockImplementationOnce(() => ({
      getRootProps: () => ({ 'data-testid': 'dropzone' }),
      getInputProps: () => ({ 'data-testid': 'file-input' }),
      isDragActive: false,
      isDragReject: false,
      onDrop: (cb: Function) => cb([file], [], {} as any)
    }));

    render(<DocumentUpload onFilesSelected={mockOnFilesSelected} />);
    expect(mockOnFilesSelected).toHaveBeenCalledWith([file]);
  });

  it('shows error for rejected files', () => {
    const { useDropzone } = require('react-dropzone');
    useDropzone.mockImplementationOnce(() => ({
      getRootProps: () => ({ 'data-testid': 'dropzone' }),
      getInputProps: () => ({ 'data-testid': 'file-input' }),
      isDragActive: false,
      isDragReject: true
    }));

    render(<DocumentUpload onFilesSelected={() => {}} />);
    expect(screen.getByText('Invalid file type or size')).toBeInTheDocument();
  });
});
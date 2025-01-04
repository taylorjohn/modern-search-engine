// src/__tests__/unit/document-upload.test.tsx
import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi, beforeEach } from 'vitest';
import DocumentUpload from '../../components/DocumentUpload';

// Mock the document service
const mockUploadDocument = vi.fn();
vi.mock('../../services/documentService', () => ({
  documentService: {
    uploadDocument: mockUploadDocument
  }
}));

describe('DocumentUpload Component', () => {
  beforeEach(() => {
    mockUploadDocument.mockClear();
  });

  it('renders the upload area', () => {
    render(<DocumentUpload />);
    expect(screen.getByTestId('dropzone')).toBeInTheDocument();
    expect(screen.getByText(/Drag and drop files here/i)).toBeInTheDocument();
    expect(screen.getByText(/Supported formats/i)).toBeInTheDocument();
  });

  it('handles file selection', async () => {
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    
    render(<DocumentUpload />);
    const input = screen.getByTestId('file-input');
    
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });

    expect(mockUploadDocument).toHaveBeenCalledWith(file);
  });

  it('handles disabled state', () => {
    render(<DocumentUpload disabled />);
    const dropzone = screen.getByTestId('dropzone');
    expect(dropzone).toHaveClass('opacity-50');
    expect(dropzone).toHaveClass('cursor-not-allowed');
  });

  it('shows correct file size limit', () => {
    const maxSizeInMB = 5;
    render(<DocumentUpload maxSize={maxSizeInMB} />);
    expect(screen.getByText(new RegExp(`${maxSizeInMB}MB`))).toBeInTheDocument();
  });

  it('handles file rejection due to size', async () => {
    const maxSizeInMB = 5;
    const file = new File(['test'.repeat(1024 * 1024 * 6)], 'large.txt', { type: 'text/plain' });
    
    render(<DocumentUpload maxSize={maxSizeInMB} />);
    const input = screen.getByTestId('file-input');
    
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });

    expect(screen.getByText(/File too large/i)).toBeInTheDocument();
  });

  it('handles multiple file selection', async () => {
    mockUploadDocument.mockClear(); // Clear mock before test
    
    const files = [
      new File(['test 1'], 'test1.txt', { type: 'text/plain' }),
      new File(['test 2'], 'test2.txt', { type: 'text/plain' })
    ];
    
    render(<DocumentUpload />);
    const input = screen.getByTestId('file-input');
    
    await act(async () => {
      fireEvent.change(input, { target: { files } });
    });

    expect(mockUploadDocument).toHaveBeenCalledTimes(2);
    expect(mockUploadDocument).toHaveBeenCalledWith(files[0]);
    expect(mockUploadDocument).toHaveBeenCalledWith(files[1]);
  });

  it('handles file drop', async () => {
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    
    render(<DocumentUpload />);
    const dropzone = screen.getByTestId('dropzone');
    
    await act(async () => {
      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [file]
        }
      });
    });

    expect(mockUploadDocument).toHaveBeenCalledWith(file);
  });
});
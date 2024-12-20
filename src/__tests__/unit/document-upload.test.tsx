// src/__tests__/unit/document-upload.test.tsx
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from '@testing-library/react';
import DocumentUpload from '../../components/document/DocumentUpload';
import { uploadService } from '../../services/uploadService';

vi.mock('../../services/uploadService', () => ({
  uploadService: {
    uploadFile: vi.fn(),
    cancelUpload: vi.fn(),
    retryUpload: vi.fn()
  }
}));

describe('DocumentUpload Component', () => {
  const mockOnFilesSelected = vi.fn();
  const mockOnUploadComplete = vi.fn();
  const mockOnUploadError = vi.fn();

  beforeEach(() => {
    mockOnFilesSelected.mockClear();
    mockOnUploadComplete.mockClear();
    mockOnUploadError.mockClear();
    vi.clearAllMocks();
  });

  // Basic rendering and interaction tests
  it('renders initial state correctly', () => {
    render(<DocumentUpload onFilesSelected={mockOnFilesSelected} />);
    
    expect(screen.getByText(/Drag and drop files here/i)).toBeInTheDocument();
    expect(screen.getByText(/Supported formats/i)).toBeInTheDocument();
    expect(screen.getByText(/PDF, HTML, TXT/i)).toBeInTheDocument();
  });

  it('handles valid file drop correctly', async () => {
    render(<DocumentUpload onFilesSelected={mockOnFilesSelected} />);
    
    const validFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const dropzone = screen.getByRole('presentation');

    await act(async () => {
      fireEvent.drop(dropzone, createDropEvent([validFile]));
    });

    expect(mockOnFilesSelected).toHaveBeenCalledWith([validFile]);
  });

  it('shows active state while dragging valid file', async () => {
    render(<DocumentUpload onFilesSelected={mockOnFilesSelected} />);
    
    const validFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const dropzone = screen.getByRole('presentation');

    await act(async () => {
      const event = createDropEvent([validFile]);
      fireEvent.dragEnter(dropzone, event);
      fireEvent.dragOver(dropzone, event);
    });

    const classes = dropzone.className;
    expect(classes).toContain('border-blue-400');
    expect(classes).toContain('bg-blue-50');
    expect(screen.getByText('Drop files here...')).toBeInTheDocument();
  });

  // Validation tests
  it('validates file types strictly', async () => {
    const accept = {
      'application/pdf': ['.pdf']
    };

    render(
      <DocumentUpload 
        onFilesSelected={mockOnFilesSelected} 
        accept={accept}
      />
    );
    
    const invalidFile = new File(['test'], 'test.exe', { type: 'application/x-msdownload' });
    const dropzone = screen.getByRole('presentation');

    await act(async () => {
      const event = createDropEvent([invalidFile]);
      fireEvent.dragOver(dropzone, event);
      fireEvent.drop(dropzone, event);
    });

    expect(screen.getByText(/Invalid file type or size/i)).toBeInTheDocument();
    expect(mockOnFilesSelected).not.toHaveBeenCalled();
    expect(dropzone.className).toContain('border-red-400');
  });

  it('handles multiple files drop correctly', async () => {
    render(<DocumentUpload onFilesSelected={mockOnFilesSelected} multiple />);
    
    const files = [
      new File(['content1'], 'test1.pdf', { type: 'application/pdf' }),
      new File(['content2'], 'test2.pdf', { type: 'application/pdf' })
    ];
    
    const dropzone = screen.getByRole('presentation');

    await act(async () => {
      fireEvent.drop(dropzone, createDropEvent(files));
    });

    expect(mockOnFilesSelected).toHaveBeenCalledWith(files);
  });

  it('enforces file size limits', async () => {
    const maxSize = 1024; // 1KB
    render(
      <DocumentUpload 
        onFilesSelected={mockOnFilesSelected} 
        maxSize={maxSize}
      />
    );
    
    const largeFile = new File(['x'.repeat(maxSize + 100)], 'large.pdf', { 
      type: 'application/pdf' 
    });
    const dropzone = screen.getByRole('presentation');

    await act(async () => {
      const event = createDropEvent([largeFile]);
      fireEvent.dragOver(dropzone, event);
      fireEvent.drop(dropzone, event);
    });

    expect(screen.getByText(/Invalid file type or size/i)).toBeInTheDocument();
    expect(mockOnFilesSelected).not.toHaveBeenCalled();
  });

  // State and UI tests
  it('reflects disabled state properly', async () => {
    render(<DocumentUpload onFilesSelected={mockOnFilesSelected} disabled />);
    
    const dropzone = screen.getByRole('presentation');
    expect(dropzone.className).toContain('opacity-50');
    expect(dropzone.className).toContain('cursor-not-allowed');

    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    await act(async () => {
      fireEvent.drop(dropzone, createDropEvent([file]));
    });

    expect(mockOnFilesSelected).not.toHaveBeenCalled();
  });

  it('displays correct size limit in UI', () => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    render(
      <DocumentUpload 
        onFilesSelected={mockOnFilesSelected} 
        maxSize={maxSize}
      />
    );
    
    expect(screen.getByText(/5MB/)).toBeInTheDocument();
  });

  it('prevents drop when multiple is false', async () => {
    render(
      <DocumentUpload 
        onFilesSelected={mockOnFilesSelected} 
        multiple={false}
      />
    );
    
    const files = [
      new File(['content1'], 'test1.pdf', { type: 'application/pdf' }),
      new File(['content2'], 'test2.pdf', { type: 'application/pdf' })
    ];
    
    const dropzone = screen.getByRole('presentation');

    await act(async () => {
      fireEvent.drop(dropzone, createDropEvent(files));
    });

    expect(mockOnFilesSelected).not.toHaveBeenCalled();
    expect(screen.getByText(/Invalid file type or size/i)).toBeInTheDocument();
  });

  // Upload functionality tests
  it('handles successful file upload with progress', async () => {
    render(
      <DocumentUpload 
        onFilesSelected={mockOnFilesSelected}
        onUploadComplete={mockOnUploadComplete}
      />
    );

    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    (uploadService.uploadFile as jest.Mock).mockImplementation(
      async (file, onProgress) => {
        onProgress?.({
          uploadedBytes: 50,
          totalBytes: 100,
          percentage: 50,
          status: 'uploading',
          fileName: file.name
        });
        return { id: '123', url: 'test-url' };
      }
    );

    const dropzone = screen.getByRole('presentation');
    await act(async () => {
      fireEvent.drop(dropzone, createDropEvent([file]));
    });

    await waitFor(() => {
      expect(screen.getByText(/50%/i)).toBeInTheDocument();
    });
    
    expect(screen.getByText('test.pdf')).toBeInTheDocument();
    expect(mockOnUploadComplete).toHaveBeenCalled();
  });

  it('handles upload failure correctly', async () => {
    render(
      <DocumentUpload 
        onFilesSelected={mockOnFilesSelected}
        onUploadError={mockOnUploadError}
      />
    );

    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const error = new Error('Upload failed');
    (uploadService.uploadFile as jest.Mock).mockRejectedValue(error);

    const dropzone = screen.getByRole('presentation');
    await act(async () => {
      fireEvent.drop(dropzone, createDropEvent([file]));
    });

    await waitFor(() => {
      expect(mockOnUploadError).toHaveBeenCalledWith(error, 'test.pdf');
    });
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });

  it('supports upload cancellation', async () => {
    render(<DocumentUpload onFilesSelected={mockOnFilesSelected} />);

    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    (uploadService.uploadFile as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const dropzone = screen.getByRole('presentation');
    await act(async () => {
      fireEvent.drop(dropzone, createDropEvent([file]));
    });

    await waitFor(() => {
      const cancelButton = screen.getByLabelText(/cancel upload/i);
      fireEvent.click(cancelButton);
    });

    expect(uploadService.cancelUpload).toHaveBeenCalled();
  });

  it('allows upload retry after failure', async () => {
    render(<DocumentUpload onFilesSelected={mockOnFilesSelected} />);

    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    (uploadService.uploadFile as jest.Mock)
      .mockRejectedValueOnce(new Error('Upload failed'))
      .mockResolvedValueOnce({ id: '123', url: 'test-url' });

    const dropzone = screen.getByRole('presentation');
    await act(async () => {
      fireEvent.drop(dropzone, createDropEvent([file]));
    });

    await waitFor(() => {
      const retryButton = screen.getByLabelText(/retry upload/i);
      fireEvent.click(retryButton);
    });

    expect(uploadService.retryUpload).toHaveBeenCalled();
  });
});

// Helper function to create drop events
function createDropEvent(files: File[]): any {
  return {
    dataTransfer: {
      files,
      items: files.map(file => ({
        kind: 'file',
        type: file.type,
        getAsFile: () => file
      })),
      types: ['Files']
    },
    preventDefault: () => {},
    stopPropagation: () => {}
  };
}
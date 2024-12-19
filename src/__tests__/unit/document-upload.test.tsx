// src/__tests__/unit/document-upload.test.tsx
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from '@testing-library/react';
import DocumentUpload from '../../components/document/DocumentUpload';

describe('DocumentUpload Component', () => {
  const mockOnFilesSelected = vi.fn();

  beforeEach(() => {
    mockOnFilesSelected.mockClear();
  });

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
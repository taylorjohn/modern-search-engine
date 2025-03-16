// src/__tests__/unit/document-upload.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DocumentUpload } from '@/components/document';

// Store the onDrop callback to call it directly
let dropCallback: ((acceptedFiles: File[]) => void) | null = null;

// Create mock handler
const mockUseDropzone = vi.fn(({ onDrop, disabled }: any) => {
  // Store the callback so we can call it from our tests
  dropCallback = onDrop;

  return {
    getRootProps: () => ({
      'data-testid': 'dropzone'
    }),
    getInputProps: () => ({
      'data-testid': 'file-input'
    }),
    isDragActive: false,
    isDragReject: false,
    disabled
  };
});

// Mock react-dropzone
vi.mock('react-dropzone', () => ({
  useDropzone: (props: any) => mockUseDropzone(props)
}));

describe('DocumentUpload Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dropCallback = null;
    mockUseDropzone.mockImplementation(({ onDrop, disabled }: any) => {
      dropCallback = onDrop;
      return {
        getRootProps: () => ({
          'data-testid': 'dropzone'
        }),
        getInputProps: () => ({
          'data-testid': 'file-input'
        }),
        isDragActive: false,
        isDragReject: false,
        disabled
      };
    });
  });

  it('renders upload area correctly', () => {
    render(<DocumentUpload onFilesSelected={() => {}} />);
    expect(screen.getByTestId('dropzone')).toBeInTheDocument();
    expect(screen.getByTestId('file-input')).toBeInTheDocument();
  });

  it('handles file upload correctly', () => {
    const mockOnFilesSelected = vi.fn();
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });

    render(<DocumentUpload onFilesSelected={mockOnFilesSelected} />);

    // Call the stored callback directly
    if (dropCallback) {
      dropCallback([file]);
      expect(mockOnFilesSelected).toHaveBeenCalledWith([file]);
    } else {
      throw new Error('Drop callback not set');
    }
  });

  it('shows error for rejected files', () => {
    // Override mock for reject state
    mockUseDropzone.mockReturnValueOnce({
      getRootProps: () => ({ 'data-testid': 'dropzone' }),
      getInputProps: () => ({ 'data-testid': 'file-input' }),
      isDragActive: false,
      isDragReject: true,
      disabled: false
    });

    render(<DocumentUpload onFilesSelected={() => {}} />);
    expect(screen.getByText('Invalid file type or size')).toBeInTheDocument();
  });

  it('respects disabled state', () => {
    const mockOnFilesSelected = vi.fn();
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });

    render(<DocumentUpload onFilesSelected={mockOnFilesSelected} disabled={true} />);

    // Verify disabled styles
    const dropzone = screen.getByTestId('dropzone');
    expect(dropzone.className).toContain('opacity-50');
    expect(dropzone.className).toContain('cursor-not-allowed');

    // Try to upload while disabled
    if (dropCallback) {
      dropCallback([file]);
      expect(mockOnFilesSelected).not.toHaveBeenCalled();
    } else {
      throw new Error('Drop callback not set');
    }
  });
});
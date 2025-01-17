// src/__tests__/integration/document-upload-flow.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import Search from '../../pages/Search';

// Create mock functions
const mockUseDropzone = vi.fn();

// Mock react-dropzone
vi.mock('react-dropzone', () => ({
  useDropzone: (props: any) => mockUseDropzone(props)
}));

describe('Document Upload Flow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    // Default mock implementation
    mockUseDropzone.mockImplementation((props) => ({
      getRootProps: () => ({
        'data-testid': 'dropzone',
        onClick: () => {
          const file = new File(['test'], 'test.txt', { type: 'text/plain' });
          props.onDrop([file]);
        }
      }),
      getInputProps: () => ({ 'data-testid': 'file-input' }),
      isDragActive: false,
      isDragReject: false
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should handle file upload process transparently', async () => {
    await act(async () => {
      render(<Search />);
    });

    await act(async () => {
      screen.getByTestId('dropzone').click();
      vi.advanceTimersByTime(2000); // Run all timers at once
    });

    expect(screen.getByText(/Processing complete/i)).toBeInTheDocument();
  });

  it('should show error state for invalid files', async () => {
    // Override mock for error state
    mockUseDropzone.mockImplementation(() => ({
      getRootProps: () => ({ 'data-testid': 'dropzone' }),
      getInputProps: () => ({ 'data-testid': 'file-input' }),
      isDragActive: false,
      isDragReject: true
    }));

    render(<Search />);
    expect(screen.getByText(/Invalid file type or size/i)).toBeInTheDocument();
  });
});
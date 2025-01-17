// src/__tests__/integration/search-flow.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import Search from '../../pages/Search';

const mockUpload = vi.fn();
let onDropCallback: ((files: File[]) => void) | null = null;

// Mock react-dropzone
vi.mock('react-dropzone', () => ({
  useDropzone: (config: any) => {
    onDropCallback = config.onDrop;
    return {
      getRootProps: () => ({
        'data-testid': 'dropzone',
        onClick: () => {
          const file = new File(['test'], 'test.txt', { type: 'text/plain' });
          if (onDropCallback) {
            onDropCallback([file]);
          }
        }
      }),
      getInputProps: () => ({ 'data-testid': 'file-input' }),
      isDragActive: false,
      isDragReject: false
    };
  }
}));

describe('Search Flow Integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockUpload.mockClear();
    onDropCallback = null;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('handles file upload', async () => {
    await act(async () => {
      render(<Search />);
    });

    // Trigger file upload
    await act(async () => {
      screen.getByTestId('dropzone').click();
      // Run all timers in sequence
      await vi.runAllTimersAsync();
    });

    // Verify final state
    expect(screen.getByText(/Processing complete/i)).toBeInTheDocument();
  });
});
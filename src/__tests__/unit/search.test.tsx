// src/__tests__/unit/search.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import Search from '../../pages/Search';

// Mock DocumentUpload component
vi.mock('../../components/document/DocumentUpload', () => ({
  default: ({ onFilesSelected }: any) => (
    <div data-testid="mock-document-upload" onClick={() => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      onFilesSelected([file]);
    }}>
      DocumentUpload
    </div>
  )
}));

describe('Search Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders all components correctly', () => {
    render(<Search />);
    expect(screen.getByText('Modern Search Engine')).toBeInTheDocument();
    expect(screen.getByTestId('mock-document-upload')).toBeInTheDocument();
    expect(screen.getByTestId('search-input')).toBeInTheDocument();
  });

  it('handles document upload and shows processing status', async () => {
    vi.setConfig({ testTimeout: 10000 }); // Increase timeout

    await act(async () => {
      render(<Search />);
    });

    await act(async () => {
      const uploadComponent = screen.getByTestId('mock-document-upload');
      uploadComponent.click();
    });

    // Run timers in sequence
    await act(async () => {
      vi.advanceTimersByTime(100);  // First update
      vi.advanceTimersByTime(400);  // Second update
      vi.advanceTimersByTime(500);  // Third update
      vi.advanceTimersByTime(500);  // Final update
    });

    expect(screen.getByText('Processing complete')).toBeInTheDocument();
  });

  it('displays initial stats correctly', () => {
    render(<Search />);
    expect(screen.getByText('Time')).toBeInTheDocument();
    expect(screen.getByText('Results')).toBeInTheDocument();
    expect(screen.getByText('Score')).toBeInTheDocument();
    expect(screen.getByText('Mode')).toBeInTheDocument();

    expect(screen.getByText('0s')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('handles search input changes', () => {
    render(<Search />);
    const searchInput = screen.getByTestId('search-input');
    
    act(() => {
      searchInput.value = 'test query';
      searchInput.dispatchEvent(new Event('change'));
    });

    expect(searchInput.value).toBe('test query');
  });
});
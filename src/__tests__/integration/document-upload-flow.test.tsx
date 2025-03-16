// src/__tests__/integration/document-upload-flow.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import Search from '../../pages/Search';

// Mock document component
vi.mock('@/components/document', () => ({
  DocumentUpload: ({ onFilesSelected }: any) => (
    <div
      data-testid="dropzone"
      onClick={() => {
        const file = new File(['test'], 'test.txt', { type: 'text/plain' });
        onFilesSelected([file]);
      }}
    >
      Upload Files
    </div>
  ),
  ProcessingStatus: ({ status }: any) => (
    <div data-testid="processing-status">
      <p>{status.message}</p>
    </div>
  )
}));

// Mock search components
vi.mock('@/components/search', () => ({
  SearchBar: () => <div data-testid="search-bar">Search Bar</div>,
  SearchResultList: () => <div>Results</div>,
  SearchHistory: () => <div>History</div>
}));

// Mock services
vi.mock('@/services', () => ({
  searchService: {
    search: vi.fn().mockImplementation(() => [])
  }
}));

describe('Document Upload Flow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should handle file upload process transparently', async () => {
    render(<Search />);

    act(() => {
      screen.getByTestId('dropzone').click();
    });

    act(() => {
      vi.advanceTimersByTime(2000); // Run all timers at once
    });

    // Force a re-render to see updated state
    act(() => {});

    expect(screen.getByTestId('processing-status')).toBeInTheDocument();
  });
});
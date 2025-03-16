// src/__tests__/integration/search-flow.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import Search from '../../pages/Search';

// Mock document components
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
  SearchBar: ({ value, onChange, onSearch }: any) => (
    <div data-testid="search-bar">
      <input
        data-testid="search-input"
        value={value}
        onChange={(e: any) => onChange(e.target.value)}
      />
      <button onClick={onSearch}>Search</button>
    </div>
  ),
  SearchResultList: () => <div data-testid="search-results">Results</div>,
  SearchHistory: () => <div data-testid="search-history">History</div>
}));

// Mock services
vi.mock('@/services', () => ({
  searchService: {
    search: vi.fn().mockImplementation(() => [
      {
        id: '1',
        title: 'Test Document',
        content: 'Test content',
        score: 0.8
      }
    ])
  }
}));

describe('Search Flow Integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('handles file upload and search process', async () => {
    render(<Search />);

    // Trigger file upload
    act(() => {
      screen.getByTestId('dropzone').click();
    });

    // Advance timers
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Force a re-render to see updated state
    act(() => {});

    // Verify processing status appears
    expect(screen.getByTestId('processing-status')).toBeInTheDocument();

    // Now test search functionality
    const searchInput = screen.getByTestId('search-input');
    act(() => {
      fireEvent.change(searchInput, { target: { value: 'test query' } });
    });

    // Check that the search metrics update
    expect(screen.getByTestId('metric-results')).toBeInTheDocument();
  });
});
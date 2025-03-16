import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
import Search from '../../pages/Search';

// Mock components
vi.mock('@/components/document', () => ({
  DocumentUpload: ({ onFilesSelected }: any) => (
    <div
      data-testid="mock-document-upload"
      onClick={() => {
        const file = new File(['test'], 'test.txt', { type: 'text/plain' });
        onFilesSelected([file]);
      }}
    >
      DocumentUpload
    </div>
  ),
  ProcessingStatus: ({ status }: any) => (
    <div data-testid="processing-status">
      <p>{status.message}</p>
    </div>
  )
}));

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

vi.mock('@/components/ui', () => ({
  Card: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  MetricCard: ({ title, value }: any) => (
    <div data-testid={`metric-${title}`}>
      {title}: {value}
    </div>
  )
}));

vi.mock('@/services', () => ({
  searchService: {
    search: vi.fn().mockImplementation((query) => {
      return query === 'empty' ? [] : [
        {
          id: '1',
          title: 'Test Document',
          content: 'Test content',
          score: 0.8
        }
      ];
    })
  }
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
    render(<Search />);
    const uploadComponent = screen.getByTestId('mock-document-upload');

    act(() => {
      uploadComponent.click();
    });

    // Advance timers to simulate file processing
    act(() => {
      vi.advanceTimersByTime(2000); // Simulate 2 seconds of processing
    });

    // We need to force a re-render after timers to get updated state
    act(() => {});

    // Check that the processing status component has processed the status correctly
    expect(screen.getByTestId('processing-status')).toBeInTheDocument();
  });

  it('displays initial stats correctly', () => {
    render(<Search />);
    expect(screen.getByTestId('metric-Time')).toBeInTheDocument();
    expect(screen.getByTestId('metric-Results')).toBeInTheDocument();
    expect(screen.getByTestId('metric-Score')).toBeInTheDocument();
    expect(screen.getByTestId('metric-Mode')).toBeInTheDocument();
  });

  it('handles search input changes', () => {
    render(<Search />);
    const searchInput = screen.getByTestId('search-input') as HTMLInputElement;

    act(() => {
      fireEvent.change(searchInput, { target: { value: 'test query' } });
    });

    expect(searchInput.value).toBe('test query');
  });
});
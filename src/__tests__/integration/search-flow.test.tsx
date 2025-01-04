import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Search from '@/pages/Search';

// Mock UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className, ...props }) => (
    <div data-testid="mock-card" className={className} {...props}>
      {children}
    </div>
  ),
  CardContent: ({ children, ...props }) => (
    <div data-testid="mock-card-content" {...props}>
      {children}
    </div>
  )
}));

vi.mock('@/components/ui/input', () => ({
  Input: ({ className, ...props }) => (
    <input data-testid="mock-input" className={className} {...props} />
  )
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, className, ...props }) => (
    <button data-testid="mock-button" className={className} {...props}>
      {children}
    </button>
  )
}));

// Mock the Lucide icons
vi.mock('lucide-react', () => ({
  Search: () => <div data-testid="search-icon">Search Icon</div>,
  ChevronDown: () => <div data-testid="chevron-down">Chevron Down</div>,
  ChevronUp: () => <div data-testid="chevron-up">Chevron Up</div>,
  BarChart2: () => <div data-testid="chart-icon">Chart Icon</div>,
  Clock: () => <div data-testid="clock-icon">Clock Icon</div>,
  Hash: () => <div data-testid="hash-icon">Hash Icon</div>,
  Zap: () => <div data-testid="zap-icon">Zap Icon</div>,
  History: () => <div data-testid="history-icon">History Icon</div>,
  Upload: () => <div data-testid="upload-icon">Upload Icon</div>,
}));

// Mock the search functionality
vi.mock('@/mockData', () => ({
  mockSearch: vi.fn(),
  mockSearchHistory: [],
  mockStats: {
    time: '0.5s',
    results: 0,
    score: '0%',
    mode: 'vector'
  },
  enhancedMockDocuments: []
}));

const findMetricCard = (container: HTMLElement, metricName: string) => {
  const cards = container.querySelectorAll('[data-testid="mock-card"]');
  for (const card of cards) {
    const text = card.textContent;
    if (text && text.includes(metricName)) {
      return card;
    }
  }
  return null;
};

describe('Search Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should perform search and show transparency features', async () => {
    const mockResult = {
      id: '1',
      title: 'Test Document',
      content: 'Test content',
      scores: {
        textScore: 0.8,
        vectorScore: 0.9,
        finalScore: 0.85
      },
      metadata: {
        author: 'Test Author',
        created: '2024-01-01',
        wordCount: 1000,
        type: 'document'
      },
      tags: ['test']
    };

    const { mockSearch } = await import('@/mockData');
    mockSearch.mockImplementation(() => Promise.resolve([mockResult]));

    const { container } = render(
      <MemoryRouter>
        <Search />
      </MemoryRouter>
    );

    // Verify initial state
    expect(screen.getByPlaceholderText('Search documents...')).toBeInTheDocument();
    
    // Trigger search
    const searchInput = screen.getByPlaceholderText('Search documents...');
    await userEvent.type(searchInput, 'test query');
    
    // Check metric cards are present using our helper function
    await waitFor(() => {
      const timeCard = findMetricCard(container, 'Time');
      const resultsCard = findMetricCard(container, 'Results');
      const scoreCard = findMetricCard(container, 'Score');
      const modeCard = findMetricCard(container, 'Mode');

      expect(timeCard).toBeInTheDocument();
      expect(resultsCard).toBeInTheDocument();
      expect(scoreCard).toBeInTheDocument();
      expect(modeCard).toBeInTheDocument();
    });
  });

  it('should handle empty results gracefully', async () => {
    const { mockSearch } = await import('@/mockData');
    mockSearch.mockImplementation(() => Promise.resolve([]));

    render(
      <MemoryRouter>
        <Search />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText('Search documents...');
    await userEvent.type(searchInput, 'no results query');

    await waitFor(() => {
      expect(screen.getByText('No documents found. Try uploading some documents first.')).toBeInTheDocument();
    });

    expect(screen.queryByText('Score Breakdown')).not.toBeInTheDocument();
  });

  it('should update transparency metrics', async () => {
    const mockResult = {
      id: '1',
      title: 'Test Document',
      content: 'Test content',
      scores: {
        textScore: 0.95,
        vectorScore: 0.85,
        finalScore: 0.90
      },
      metadata: {
        author: 'Test Author',
        created: '2024-01-01',
        wordCount: 1000,
        type: 'document'
      },
      tags: ['test']
    };

    const { mockSearch } = await import('@/mockData');
    mockSearch.mockImplementation(() => Promise.resolve([mockResult]));

    const { container } = render(
      <MemoryRouter>
        <Search />
      </MemoryRouter>
    );

    // Perform search
    const searchInput = screen.getByPlaceholderText('Search documents...');
    await userEvent.type(searchInput, 'test query');

    // Check metric updates
    await waitFor(() => {
      const timeCard = findMetricCard(container, 'Time');
      const resultsCard = findMetricCard(container, 'Results');
      const scoreCard = findMetricCard(container, 'Score');
      const modeCard = findMetricCard(container, 'Mode');

      expect(timeCard).toBeInTheDocument();
      expect(resultsCard).toBeInTheDocument();
      expect(scoreCard).toBeInTheDocument();
      expect(modeCard).toBeInTheDocument();

      // Verify metric values
      expect(within(resultsCard!).getByText('0')).toBeInTheDocument();
      expect(within(scoreCard!).getByText('0%')).toBeInTheDocument();
      expect(within(modeCard!).getByText('vector')).toBeInTheDocument();
    });
  });
});
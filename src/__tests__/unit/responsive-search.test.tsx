import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// Mock the component manually since vi.mock is having issues with the barrel exports
const mockSearchBar = vi.fn(({ value, onChange, onSearch }) => (
  <div data-testid="search-bar">
    <input
      data-testid="search-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
    <button onClick={onSearch}>Search</button>
  </div>
));

const mockSearchResultList = vi.fn(({ results, isLoading, query }) => (
  <div data-testid="search-results">
    {isLoading ? 'Loading...' : `${results.length} results for "${query}"`}
  </div>
));

const mockMetricCard = vi.fn(({ title, value }) => (
  <div data-testid={`metric-${title}`}>
    {title}: {value}
  </div>
));

const mockToast = vi.fn(({ message, onClose }) => (
  <div data-testid="toast">
    {message}
    <button onClick={onClose}>Close</button>
  </div>
));

const mockButton = vi.fn(({ children, onClick, className, variant }) => (
  <button
    onClick={onClick}
    className={className}
    data-variant={variant}
    data-testid={typeof children === 'string' ? children : undefined}
  >
    {children}
  </button>
));

vi.mock('@/components/search', () => ({
  SearchBar: (props) => mockSearchBar(props),
  SearchResultList: (props) => mockSearchResultList(props),
}));

vi.mock('@/components/ui', () => ({
  Card: ({ children, className }) => <div className={className}>{children}</div>,
  CardContent: ({ children, className }) => <div className={className}>{children}</div>,
  Button: (props) => mockButton(props),
  MetricCard: (props) => mockMetricCard(props),
  Toast: (props) => mockToast(props),
}));

// Create a mock search hook that can be reconfigured per test
const mockUseSearchAPI = vi.fn().mockReturnValue({
  query: 'test query',
  setQuery: vi.fn(),
  results: [
    { id: '1', title: 'Test Document', content: 'Test content', score: 0.8 }
  ],
  isSearching: false,
  totalResults: 1,
  executionTime: 120,
  suggestions: ['test suggestion'],
  isLoadingSuggestions: false,
  search: vi.fn(),
  clearSearch: vi.fn(),
  hasResults: true,
  error: null,
  updateFilters: vi.fn()
});

vi.mock('@/hooks/useSearchAPI', () => ({
  useSearchAPI: () => mockUseSearchAPI()
}));

vi.mock('@/hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: vi.fn()
}));

vi.mock('@/contexts/ErrorContext', () => ({
  useError: () => ({
    handleError: vi.fn(),
    clearError: vi.fn(),
    error: null,
  })
}));

// Import the actual component after all mocks are set up
import ResponsiveSearch from '@/components/search/ResponsiveSearch';

describe('ResponsiveSearch Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search bar and metrics', () => {
    render(<ResponsiveSearch />);
    
    // Check if SearchBar was called
    expect(mockSearchBar).toHaveBeenCalled();
    
    // Check if MetricCard was called for each metric
    expect(mockMetricCard).toHaveBeenCalledTimes(3);
    
    // Check that one call included the Time title
    const timeCall = mockMetricCard.mock.calls.find(
      call => call[0].title === 'Time'
    );
    expect(timeCall).toBeTruthy();
    
    // Check that one call included the Results title
    const resultsCall = mockMetricCard.mock.calls.find(
      call => call[0].title === 'Results'
    );
    expect(resultsCall).toBeTruthy();
    
    // Check that one call included the Score title
    const scoreCall = mockMetricCard.mock.calls.find(
      call => call[0].title === 'Score'
    );
    expect(scoreCall).toBeTruthy();
  });

  it('renders search results', () => {
    render(<ResponsiveSearch />);
    
    // Check if SearchResultList was called
    expect(mockSearchResultList).toHaveBeenCalled();
  });

  it('has search bar with correct props', () => {
    render(<ResponsiveSearch />);
    
    // Check that SearchBar was called with the correct props
    const searchBarCall = mockSearchBar.mock.calls[0][0];
    expect(searchBarCall.value).toBe('test query');
    expect(searchBarCall.isLoading).toBe(false);
    expect(searchBarCall.placeholder).toBe('Search documents...');
  });

  it('shows error message when search error occurs', () => {
    // Configure the mock to return an error
    mockUseSearchAPI.mockReturnValueOnce({
      query: 'test query',
      setQuery: vi.fn(),
      results: [],
      isSearching: false,
      totalResults: 0,
      executionTime: 0,
      suggestions: [],
      isLoadingSuggestions: false,
      search: vi.fn(),
      clearSearch: vi.fn(),
      hasResults: false,
      error: { message: 'Search failed', type: 'search' },
      updateFilters: vi.fn()
    });
    
    render(<ResponsiveSearch />);
    
    // Check that Card component was called with the error class
    const cards = document.querySelectorAll('[class*="border-red-300"]');
    expect(cards.length).toBeGreaterThan(0);
  });
  
  it('correctly renders with different props', () => {
    // Reset the mock
    mockButton.mockClear();
    
    // Configure the mock to return different data
    mockUseSearchAPI.mockReturnValueOnce({
      query: 'another query',
      setQuery: vi.fn(),
      results: [],
      isSearching: true, // Show loading state
      totalResults: 0,
      executionTime: 0,
      suggestions: [],
      isLoadingSuggestions: false,
      search: vi.fn(),
      clearSearch: vi.fn(),
      hasResults: false,
      error: null,
      updateFilters: vi.fn()
    });
    
    render(<ResponsiveSearch />);
    
    // Check if SearchBar is called with isLoading=true
    const searchBarCall = mockSearchBar.mock.calls[0][0];
    expect(searchBarCall.isLoading).toBe(true);
    
    // Check if search results list shows loading state
    const searchResultsCall = mockSearchResultList.mock.calls[0][0];
    expect(searchResultsCall.isLoading).toBe(true);
  });
});
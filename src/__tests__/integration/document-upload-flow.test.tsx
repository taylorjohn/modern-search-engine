import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

// Mock the icons
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

// Helper function to find a specific metric
const getMetricValue = (container: HTMLElement, metricTestId: string) => {
  const card = container.querySelector(`[data-testid="metric-${metricTestId}"]`);
  if (!card) return null;
  const value = card.querySelector('[data-testid="metric-value"]');
  return value ? value.textContent : null;
};

describe('Document Upload Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle file upload process transparently', async () => {
    const { container } = render(
      <MemoryRouter>
        <Search />
      </MemoryRouter>
    );

    // Check initial metric values
    await waitFor(() => {
      expect(container.querySelector('[data-testid="metric-time"]')).toBeInTheDocument();
      expect(container.querySelector('[data-testid="metric-results"]')).toBeInTheDocument();
      expect(container.querySelector('[data-testid="metric-score"]')).toBeInTheDocument();
      expect(container.querySelector('[data-testid="metric-mode"]')).toBeInTheDocument();
    });

    // Get upload button
    const uploadButton = screen.getByText(/Upload Documents/);
    fireEvent.click(uploadButton);

    // Verify specific metric values
    await waitFor(() => {
      // Time metric
      const timeValue = getMetricValue(container, 'time');
      expect(timeValue).toBe('0ms');

      // Results metric
      const resultsValue = getMetricValue(container, 'results');
      expect(resultsValue).toBe('0');

      // Score metric
      const scoreValue = getMetricValue(container, 'score');
      expect(scoreValue).toBe('0%');

      // Mode metric
      const modeValue = getMetricValue(container, 'mode');
      expect(modeValue).toBe('vector');
    });
  });

  it('should update transparency metrics during upload', async () => {
    const { container } = render(
      <MemoryRouter>
        <Search />
      </MemoryRouter>
    );

    // Create a mock file
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    
    // Check metric cards are present with specific data-testids
    await waitFor(() => {
      const timeMetric = container.querySelector('[data-testid="metric-time"]');
      const resultsMetric = container.querySelector('[data-testid="metric-results"]');
      const scoreMetric = container.querySelector('[data-testid="metric-score"]');
      const modeMetric = container.querySelector('[data-testid="metric-mode"]');

      expect(timeMetric).toBeInTheDocument();
      expect(resultsMetric).toBeInTheDocument();
      expect(scoreMetric).toBeInTheDocument();
      expect(modeMetric).toBeInTheDocument();

      // Verify initial values
      expect(getMetricValue(container, 'results')).toBe('0');
      expect(getMetricValue(container, 'score')).toBe('0%');
      expect(getMetricValue(container, 'mode')).toBe('vector');
    });
  });
});
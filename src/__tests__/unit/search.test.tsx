import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Search from '../../pages/Search';
import { documentService } from '../../services/documentService';

vi.mock('../../services/documentService', () => ({
  documentService: {
    searchDocuments: vi.fn(() => Promise.resolve([])),
    subscribeToProcessing: vi.fn(() => ({
      unsubscribe: vi.fn()
    }))
  }
}));

const mockResults = [{
  id: '1',
  title: 'Test Document',
  content: 'Test content',
  documentType: 'pdf',
  scores: {
    textScore: 0.8,
    vectorScore: 0.9,
    finalScore: 0.85
  },
  metadata: {
    author: 'Test Author',
    created: '2024-01-01',
    wordCount: 100,
    type: 'document'
  },
  tags: []
}];

describe('Search Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders initial state correctly', () => {
    render(
      <BrowserRouter>
        <Search />
      </BrowserRouter>
    );
    expect(screen.getByPlaceholderText('Search documents...')).toBeInTheDocument();
  });

  it('performs search and displays results', async () => {
    (documentService.searchDocuments as any).mockResolvedValueOnce(mockResults);

    render(
      <BrowserRouter>
        <Search />
      </BrowserRouter>
    );

    const input = screen.getByPlaceholderText('Search documents...');
    fireEvent.change(input, { target: { value: 'test' } });

    await waitFor(() => {
      expect(screen.getByText('Test Document')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
    });
  });

  it('expands and collapses result details', async () => {
    (documentService.searchDocuments as any).mockResolvedValueOnce(mockResults);

    render(
      <BrowserRouter>
        <Search />
      </BrowserRouter>
    );

    const input = screen.getByPlaceholderText('Search documents...');
    fireEvent.change(input, { target: { value: 'test' } });

    await waitFor(() => {
      expect(screen.getByText('Test Document')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/show details/i));
    expect(screen.getByText('Score Breakdown')).toBeInTheDocument();

    fireEvent.click(screen.getByText(/hide details/i));
    expect(screen.queryByText('Score Breakdown')).not.toBeInTheDocument();
  });

  it('shows loading state during search', async () => {
    (documentService.searchDocuments as any).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve([]), 100))
    );

    render(
      <BrowserRouter>
        <Search />
      </BrowserRouter>
    );

    const input = screen.getByPlaceholderText('Search documents...');
    fireEvent.change(input, { target: { value: 'test' } });

    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });

  it('handles empty search results', async () => {
    (documentService.searchDocuments as any).mockResolvedValueOnce([]);

    render(
      <BrowserRouter>
        <Search />
      </BrowserRouter>
    );

    const input = screen.getByPlaceholderText('Search documents...');
    fireEvent.change(input, { target: { value: 'nonexistent' } });

    await waitFor(() => {
      expect(screen.getByText(/no documents found/i)).toBeInTheDocument();
    });
  });
});
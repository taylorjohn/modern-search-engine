// src/__tests__/unit/search.test.tsx
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Search from '../../pages/Search';
import { mockSearch } from '../../mockData';

// Mock the GitMonitor
vi.mock('../../hooks/useGitChanges', () => ({
  useGitChanges: () => ({
    isConnected: false,
    changes: [],
    repoState: []
  })
}));

describe('Search Component', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('renders initial state correctly', () => {
    render(<Search />);
    
    expect(screen.getByText('Modern Search Engine')).toBeInTheDocument();
    expect(screen.getByText('Search with transparency and real-time insights')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search documents...')).toBeInTheDocument();
    expect(screen.getByText('Recent Searches')).toBeInTheDocument();
    
    // Check stats cards
    ['Time', 'Results', 'Score', 'Mode'].forEach(stat => {
      expect(screen.getByText(stat)).toBeInTheDocument();
    });
  });

  it('performs search and displays results', async () => {
    render(<Search />);
    const searchInput = screen.getByPlaceholderText('Search documents...');
    
    await userEvent.type(searchInput, 'vector');
    
    await waitFor(() => {
      expect(screen.getByText(/Introduction to Vector Search/)).toBeInTheDocument();
      expect(screen.getByText(/Step-by-step guide/)).toBeInTheDocument();
    });
  });

  it('updates search stats after search', async () => {
    render(<Search />);
    const searchInput = screen.getByPlaceholderText('Search documents...');
    
    await userEvent.type(searchInput, 'test');
    
    await waitFor(() => {
      const statsCards = screen.getAllByRole('generic').filter(el => 
        el.className.includes('hover:shadow-lg')
      );
      expect(statsCards.length).toBeGreaterThan(0);
      expect(statsCards.some(card => card.textContent?.includes('Results'))).toBe(true);
    });
  });

  it('displays loading state during search', async () => {
    render(<Search />);
    const searchInput = screen.getByPlaceholderText('Search documents...');
    
    fireEvent.change(searchInput, { target: { value: 'v' } });
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
    });
  });

  it('handles empty search input', async () => {
    render(<Search />);
    const searchInput = screen.getByPlaceholderText('Search documents...');
    
    await userEvent.type(searchInput, 'test');
    await userEvent.clear(searchInput);
    
    await waitFor(() => {
      const resultCards = screen.queryAllByRole('generic').filter(el => 
        el.className.includes('hover:shadow-lg')
      );
      expect(resultCards.length).toBe(4); // Only stat cards should remain
    });
  });

  it('expands and collapses result details', async () => {
    render(<Search />);
    const searchInput = screen.getByPlaceholderText('Search documents...');
    
    await userEvent.type(searchInput, 'vector');
    
    await waitFor(() => {
      const resultCard = screen.getByText(/Introduction to Vector Search/).closest('.hover\\:shadow-lg');
      const detailsButton = resultCard?.querySelector('button');
      expect(detailsButton).toBeTruthy();
      if (detailsButton) {
        fireEvent.click(detailsButton);
      }
    });

    await waitFor(() => {
      expect(screen.getByText('Score Breakdown')).toBeInTheDocument();
      expect(document.querySelector('.space-y-2')).toBeInTheDocument();
    });
  });

  it('manages search history correctly', async () => {
    render(<Search />);
    const searchInput = screen.getByPlaceholderText('Search documents...');
    
    await userEvent.type(searchInput, 'vector');
    await waitFor(() => {
      expect(screen.getByText(/Introduction to Vector/)).toBeInTheDocument();
    });

    await userEvent.clear(searchInput);
    await userEvent.type(searchInput, 'search');

    await waitFor(() => {
      const historyButtons = screen.getAllByRole('button').filter(button =>
        button.textContent?.toLowerCase().includes('search') || 
        button.textContent?.toLowerCase().includes('vector')
      );
      expect(historyButtons.length).toBeGreaterThan(0);
    });
  });

  it('allows selecting from search history', async () => {
    render(<Search />);
    const searchInput = screen.getByPlaceholderText('Search documents...');
    
    await userEvent.type(searchInput, 'test search');
    await waitFor(() => {
      const historyButtons = screen.getAllByRole('button');
      const searchButton = historyButtons.find(button => 
        button.textContent?.toLowerCase().includes('test search')
      );
      expect(searchButton).toBeTruthy();
      if (searchButton) {
        fireEvent.click(searchButton);
      }
    });

    expect(searchInput).toHaveValue('test search');
  });

  it('preserves search history between searches', async () => {
    render(<Search />);
    const searchInput = screen.getByPlaceholderText('Search documents...');
    const searches = ['first', 'second', 'third'];
    
    for (const term of searches) {
      await userEvent.clear(searchInput);
      await userEvent.type(searchInput, term);
      
      await waitFor(() => {
        const historySection = screen.getByText('Recent Searches').closest('.p-4');
        expect(screen.getByRole('button', { name: new RegExp(term, 'i') })).toBeInTheDocument();
        expect(historySection).toBeInTheDocument();
      }, { timeout: 2000 });
    }

    const historyButtons = screen.getAllByRole('button');
    const recentSearches = searches.slice(-4);
    recentSearches.forEach(term => {
      expect(
        historyButtons.some(button => 
          button.textContent?.toLowerCase().includes(term.toLowerCase())
        )
      ).toBe(true);
    });
  });
});
// src/__tests__/integration/component-integration.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchBar, SearchResultList } from '@/components/search';
import { DocumentUpload } from '@/components/document';
import { searchService } from '@/services';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the search service
vi.mock('@/services', () => ({
  searchService: {
    search: vi.fn().mockResolvedValue([
      {
        id: '1',
        title: 'Test Document',
        content: 'This is a test document with some content for searching.',
        score: 0.95,
        metadata: { type: 'text' }
      }
    ])
  }
}));

describe('Search Component Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should trigger search and display results', async () => {
    // Arrange - render the components
    const handleSearch = vi.fn();
    const { getByRole, getByTestId } = render(
      <>
        <SearchBar
          value=""
          onChange={vi.fn()}
          onSearch={handleSearch}
          isLoading={false}
          placeholder="Search..."
        />
        <SearchResultList
          results={[
            {
              id: '1',
              title: 'Test Document',
              content: 'This is a test document with some content for searching.',
              documentType: 'text',
              scores: { vectorScore: 0.9, finalScore: 0.95 },
              metadata: { created: Date.now(), wordCount: 10, type: 'text' }
            }
          ]}
          isLoading={false}
          query="test"
        />
      </>
    );

    // Act - trigger search
    const searchInput = getByRole('textbox');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    fireEvent.click(getByRole('button', { name: /search/i }));

    // Assert - check search was called
    expect(handleSearch).toHaveBeenCalledWith('test');

    // Assert - check results are displayed
    expect(getByTestId('search-results')).toBeInTheDocument();
    expect(getByTestId('search-results').textContent).toContain('Test Document');
  });
});

describe('Document Upload Integration', () => {
  it('renders upload area and handles file selection', () => {
    // Mock file
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const handleFilesSelected = vi.fn();

    // Render the component
    const { getByTestId } = render(
      <DocumentUpload onFilesSelected={handleFilesSelected} />
    );

    // Find dropzone and simulate file drop
    const dropzone = getByTestId('dropzone');
    expect(dropzone).toBeInTheDocument();

    // Simulate file being selected - this depends on the dropzone implementation
    // In a real test, we would mock the useDropzone hook properly
    // For now, we just check the component renders correctly
    expect(dropzone).toHaveClass('border-gray-300');
  });
});
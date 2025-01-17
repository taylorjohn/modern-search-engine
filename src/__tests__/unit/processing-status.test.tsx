// src/__tests__/unit/processing-status.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProcessingStatus from '../../components/document/ProcessingStatus';

describe('ProcessingStatus Component', () => {
  it('displays processing status correctly', () => {
    const status = {
      id: '1',
      status: 'processing' as const,
      progress: 50,
      message: 'Processing files...'
    };

    render(<ProcessingStatus status={status} />);
    expect(screen.getByText('Processing files...')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByTestId('progress-bar')).toHaveStyle({ width: '50%' });
  });

  it('displays completed status with correct message', () => {
    const status = {
      id: '1',
      status: 'completed' as const,
      progress: 100,
      message: 'Processing complete'
    };

    render(<ProcessingStatus status={status} />);
    expect(screen.getByText('Processing complete')).toBeInTheDocument();
    expect(screen.getByTestId('progress-bar')).toHaveStyle({ width: '100%' });
    expect(screen.getByTestId('progress-bar').className).toContain('bg-green-500');
  });

  it('displays failed status correctly', () => {
    const status = {
      id: '1',
      status: 'failed' as const,
      progress: 75,
      message: 'Upload failed'
    };

    render(<ProcessingStatus status={status} />);
    expect(screen.getByText('Upload failed')).toBeInTheDocument();
    expect(screen.getByTestId('progress-bar').className).toContain('bg-red-500');
  });

  it('uses default completed message when message is empty', () => {
    const status = {
      id: '1',
      status: 'completed' as const,
      progress: 100,
      message: ''
    };

    render(<ProcessingStatus status={status} />);
    expect(screen.getByText('Processing complete')).toBeInTheDocument();
  });

  it('shows loading animation during processing', () => {
    const status = {
      id: '1',
      status: 'processing' as const,
      progress: 25,
      message: 'Processing files...'
    };

    render(<ProcessingStatus status={status} />);
    const loadingIcon = screen.getByTestId('processing-status').querySelector('.animate-spin');
    expect(loadingIcon).toBeInTheDocument();
  });
});
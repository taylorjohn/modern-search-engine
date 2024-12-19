// src/__tests__/unit/git-monitor.test.tsx
import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import GitMonitor from '../../components/git/GitChangesMonitor';
import { useGitChanges } from '../../hooks/useGitChanges';
import { vi } from 'vitest';

vi.mock('../../hooks/useGitChanges');

describe('GitMonitor Component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders correctly when connected', () => {
    (useGitChanges as any).mockReturnValue({
      isConnected: true,
      changes: []
    });

    render(<GitMonitor />);
    expect(screen.getByText('Git Changes Monitor')).toBeInTheDocument();
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('shows disconnected state', () => {
    (useGitChanges as any).mockReturnValue({
      isConnected: false,
      changes: []
    });

    render(<GitMonitor />);
    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });

  it('displays git changes', () => {
    const mockChanges = [
      {
        file: 'test.txt',
        status: 'M',
        timestamp: Date.now()
      }
    ];

    (useGitChanges as any).mockReturnValue({
      isConnected: true,
      changes: mockChanges
    });

    render(<GitMonitor />);
    expect(screen.getByText('test.txt')).toBeInTheDocument();
    expect(screen.getByText('M')).toBeInTheDocument();
  });
});
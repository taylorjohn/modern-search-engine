// src/__tests__/utils/test-utils.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock Components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className = '', ...props }) => (
    <div data-testid="mock-card" className={className} {...props}>
      {children}
    </div>
  ),
  CardContent: ({ children, className = '', ...props }) => (
    <div data-testid="mock-card-content" className={className} {...props}>
      {children}
    </div>
  ),
}));

// Mock Icon Components
vi.mock('lucide-react', () => ({
  Search: () => <div data-testid="search-icon">Search Icon</div>,
  ChevronDown: () => <div data-testid="chevron-down-icon">Chevron Down Icon</div>,
  ChevronUp: () => <div data-testid="chevron-up-icon">Chevron Up Icon</div>,
  BarChart2: () => <div data-testid="chart-icon">Chart Icon</div>,
  Clock: () => <div data-testid="clock-icon">Clock Icon</div>,
  Hash: () => <div data-testid="hash-icon">Hash Icon</div>,
  Zap: () => <div data-testid="zap-icon">Zap Icon</div>,
  History: () => <div data-testid="history-icon">History Icon</div>,
  FileText: () => <div data-testid="file-text-icon">File Text Icon</div>,
  Code: () => <div data-testid="code-icon">Code Icon</div>,
  Globe: () => <div data-testid="globe-icon">Globe Icon</div>,
  Upload: () => <div data-testid="upload-icon">Upload Icon</div>,
  X: () => <div data-testid="x-icon">X Icon</div>,
}));
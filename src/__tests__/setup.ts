// src/__tests__/setup.ts
import React from 'react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock UI components
const mockComponents = {
  Card: ({ children, className, ...props }) => 
    React.createElement('div', { 'data-testid': 'mock-card', className, ...props }, children),
  CardContent: ({ children, className, ...props }) => 
    React.createElement('div', { 'data-testid': 'mock-card-content', className, ...props }, children),
  CardHeader: ({ children, className, ...props }) => 
    React.createElement('div', { 'data-testid': 'mock-card-header', className, ...props }, children),
  CardTitle: ({ children, className, ...props }) => 
    React.createElement('div', { 'data-testid': 'mock-card-title', className, ...props }, children)
};

vi.mock('@/components/ui/card', () => mockComponents);
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }) => 
    React.createElement('button', { 'data-testid': 'mock-button', ...props }, children)
}));

vi.mock('@/components/ui/input', () => ({
  Input: (props) => React.createElement('input', { 'data-testid': 'mock-input', ...props })
}));
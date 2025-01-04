// src/__tests__/utils/test-utils.tsx
import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MockWebSocket } from './mocks/websocket';

interface WrapperProps {
  children: React.ReactNode;
}

export const TestWrapper: React.FC<WrapperProps> = ({ children }) => {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );
};

export const renderWithRouter = (ui: React.ReactElement) => {
  return render(ui, { wrapper: TestWrapper });
};

export const createMockWebSocket = () => {
  const mockWs = new MockWebSocket();
  return mockWs;
};
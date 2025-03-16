// src/App.tsx
import React from 'react';
import Search from '@/pages/Search';
import { ErrorProvider } from '@/contexts/ErrorContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import ErrorDisplay from '@/components/ErrorDisplay';

function App() {
  return (
    <ErrorProvider>
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50">
          <Search />
          <ErrorDisplay />
        </div>
      </ErrorBoundary>
    </ErrorProvider>
  );
}

export default App;
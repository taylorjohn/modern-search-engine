// src/components/ErrorDisplay.tsx
import React, { useEffect } from 'react';
import { useError } from '@/contexts/ErrorContext';
import { ErrorToast } from '@/components/ui/toast';

export function ErrorDisplay() {
  const { error, clearError } = useError();

  // Reset scroll position when an error occurs
  useEffect(() => {
    if (error) {
      window.scrollTo(0, 0);
    }
  }, [error]);

  if (!error) {
    return null;
  }

  return (
    <ErrorToast
      error={error}
      onClose={clearError}
    />
  );
}

export default ErrorDisplay;
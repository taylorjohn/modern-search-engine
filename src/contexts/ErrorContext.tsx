// src/contexts/ErrorContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppError, errorService, ErrorType } from '@/services/errorService';

interface ErrorContextType {
  error: AppError | null;
  setError: (error: AppError | null) => void;
  clearError: () => void;
  handleError: (error: any, defaultType?: ErrorType) => AppError;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

interface ErrorProviderProps {
  children: ReactNode;
}

export function ErrorProvider({ children }: ErrorProviderProps) {
  const [error, setError] = useState<AppError | null>(null);

  useEffect(() => {
    // Subscribe to errors from the error service
    const subscription = errorService.subscribeToErrors((appError) => {
      setError(appError);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const clearError = () => {
    setError(null);
  };

  const handleError = (error: any, defaultType?: ErrorType): AppError => {
    const appError = errorService.handleError(error, defaultType);
    return appError;
  };

  const contextValue: ErrorContextType = {
    error,
    setError,
    clearError,
    handleError
  };

  return (
    <ErrorContext.Provider value={contextValue}>
      {children}
    </ErrorContext.Provider>
  );
}

export function useError() {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
}
// src/components/ui/toast.tsx
import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { ErrorType, AppError } from '@/services/errorService';

interface ToastProps {
  message: string;
  type: 'error' | 'warning' | 'info' | 'success';
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

export function Toast({ 
  message, 
  type, 
  onClose, 
  autoClose = true, 
  duration = 5000 
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Allow time for animation
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-white" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-white" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-white" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-white" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'error':
        return 'bg-red-600';
      case 'warning':
        return 'bg-amber-600';
      case 'success':
        return 'bg-green-600';
      case 'info':
      default:
        return 'bg-blue-600';
    }
  };

  return (
    <div 
      className={`fixed bottom-4 right-4 flex items-center p-4 rounded shadow-lg max-w-md transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      } ${getBackgroundColor()}`}
      role="alert"
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="text-white">{message}</div>
      </div>
      <button 
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        className="ml-4 text-white hover:text-gray-200 focus:outline-none"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

interface ErrorToastProps {
  error: AppError;
  onClose: () => void;
}

export function ErrorToast({ error, onClose }: ErrorToastProps) {
  const getToastType = () => {
    switch (error.type) {
      case ErrorType.NETWORK:
      case ErrorType.API:
        return 'warning';
      case ErrorType.UNEXPECTED:
      case ErrorType.DOCUMENT_PROCESSING:
      case ErrorType.SEARCH:
        return 'error';
      case ErrorType.AUTHENTICATION:
        return 'info';
      default:
        return 'error';
    }
  };

  return (
    <Toast
      message={error.message}
      type={getToastType()}
      onClose={onClose}
      autoClose={error.type !== ErrorType.UNEXPECTED}
    />
  );
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'error' | 'warning' | 'info' | 'success' }>>([]);

  const addToast = (message: string, type: 'error' | 'warning' | 'info' | 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    return id;
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <div className="fixed bottom-0 right-0 p-4 space-y-4 z-50">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}
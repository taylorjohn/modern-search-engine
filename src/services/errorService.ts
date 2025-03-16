// src/services/errorService.ts
import { logger } from './logger';

/**
 * Types of errors that can occur in the application
 */
export enum ErrorType {
  API = 'API_ERROR',
  NETWORK = 'NETWORK_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  VALIDATION = 'VALIDATION_ERROR',
  DOCUMENT_PROCESSING = 'DOCUMENT_PROCESSING_ERROR',
  SEARCH = 'SEARCH_ERROR',
  UNEXPECTED = 'UNEXPECTED_ERROR'
}

/**
 * Interface for standardized error structure
 */
export interface AppError {
  type: ErrorType;
  message: string;
  code?: string;
  details?: Record<string, any>;
  originalError?: Error;
}

/**
 * Creates a standard AppError object from various error types
 * @param error Original error
 * @param defaultType Default error type to use if not specified
 * @returns Standardized AppError object
 */
export function createAppError(error: any, defaultType = ErrorType.UNEXPECTED): AppError {
  // If it's already an AppError, return it
  if (error && error.type && Object.values(ErrorType).includes(error.type)) {
    return error as AppError;
  }

  // Network errors
  if (error instanceof TypeError && error.message.includes('Network')) {
    return {
      type: ErrorType.NETWORK,
      message: 'Network error occurred. Please check your connection.',
      originalError: error
    };
  }

  // API errors
  if (error?.status || error?.statusCode) {
    const status = error.status || error.statusCode;
    
    // Authentication errors
    if (status === 401 || status === 403) {
      return {
        type: ErrorType.AUTHENTICATION,
        message: 'Authentication error. Please log in again.',
        code: status.toString(),
        originalError: error
      };
    }

    // API errors
    return {
      type: ErrorType.API,
      message: error.message || 'An API error occurred',
      code: status.toString(),
      details: error.data,
      originalError: error
    };
  }

  // Default error
  return {
    type: defaultType,
    message: error?.message || 'An unexpected error occurred',
    originalError: error instanceof Error ? error : undefined
  };
}

/**
 * Service for handling errors consistently across the application
 */
export class ErrorService {
  private errorListeners: Array<(error: AppError) => void> = [];

  /**
   * Handles an error, logs it, and notifies listeners
   * @param error Error to handle
   * @param defaultType Default error type to use
   * @returns Standardized error object
   */
  public handleError(error: any, defaultType = ErrorType.UNEXPECTED): AppError {
    const appError = createAppError(error, defaultType);
    
    // Log the error
    this.logError(appError);
    
    // Notify listeners
    this.notifyListeners(appError);
    
    return appError;
  }

  /**
   * Logs an error with appropriate level based on type
   * @param error Error to log
   */
  private logError(error: AppError): void {
    const { type, message, code, details, originalError } = error;
    
    const logData = {
      errorType: type,
      code,
      details,
      originalError: originalError?.stack
    };
    
    switch (type) {
      case ErrorType.NETWORK:
      case ErrorType.API:
        logger.warn(message, logData);
        break;
      case ErrorType.AUTHENTICATION:
        logger.info(message, logData);
        break;
      default:
        logger.error(message, logData);
    }
  }

  /**
   * Subscribes a listener for error notifications
   * @param listener Function to call when errors occur
   * @returns Unsubscribe function
   */
  public subscribeToErrors(listener: (error: AppError) => void) {
    this.errorListeners.push(listener);
    
    return {
      unsubscribe: () => {
        this.errorListeners = this.errorListeners.filter(l => l !== listener);
      }
    };
  }

  /**
   * Notifies all listeners about an error
   * @param error Error to notify about
   */
  private notifyListeners(error: AppError): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (listenerError) {
        logger.error('Error in error listener', { listenerError });
      }
    });
  }
}

export const errorService = new ErrorService();
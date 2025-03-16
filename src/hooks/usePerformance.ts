// src/hooks/usePerformance.ts
import { useEffect, useRef, useCallback } from 'react';
import { performanceMonitor } from '@/services/performanceMonitor';
import { logger } from '@/services/logger';

interface UsePerformanceOptions {
  name: string;
  threshold?: number;
  metadata?: Record<string, any>;
  onThresholdExceeded?: (duration: number) => void;
}

export function usePerformance({
  name,
  threshold,
  metadata,
  onThresholdExceeded
}: UsePerformanceOptions) {
  const startTimeRef = useRef<number | null>(null);

  const startMeasure = useCallback(() => {
    try {
      performanceMonitor.startMeasure(name, metadata);
      startTimeRef.current = performance.now();
    } catch (error) {
      logger.error('Failed to start performance measure', { error, name });
    }
  }, [name, metadata]);

  const endMeasure = useCallback(() => {
    try {
      if (startTimeRef.current) {
        performanceMonitor.endMeasure(name);
        const duration = performance.now() - startTimeRef.current;
        
        if (threshold && duration > threshold) {
          onThresholdExceeded?.(duration);
        }
        
        startTimeRef.current = null;
      }
    } catch (error) {
      logger.error('Failed to end performance measure', { error, name });
    }
  }, [name, threshold, onThresholdExceeded]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (startTimeRef.current) {
        endMeasure();
      }
    };
  }, [endMeasure]);

  return {
    startMeasure,
    endMeasure
  };
}

// Usage example with React components:
export function useComponentPerformance(componentName: string) {
  return usePerformance({
    name: `component:${componentName}`,
    threshold: 16, // 60fps threshold
    metadata: { type: 'component' },
    onThresholdExceeded: (duration) => {
      logger.warn('Component render exceeded threshold', {
        component: componentName,
        duration,
        threshold: 16
      });
    }
  });
}

// Usage example with search operations:
export function useSearchPerformance() {
  const searchIdRef = useRef<string | null>(null);

  const startSearch = useCallback((query: string) => {
    searchIdRef.current = performanceMonitor.startTrackingSearch(query);
  }, []);

  const endSearch = useCallback((resultCount: number) => {
    if (searchIdRef.current) {
      performanceMonitor.endTrackingSearch(searchIdRef.current, resultCount);
      searchIdRef.current = null;
    }
  }, []);

  return {
    startSearch,
    endSearch
  };
}

// Example HOC for automatic performance tracking
export function withPerformanceTracking<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) {
  const PerformanceTrackedComponent = (props: P) => {
    const { startMeasure, endMeasure } = useComponentPerformance(componentName);

    useEffect(() => {
      startMeasure();
      return () => endMeasure();
    }, [startMeasure, endMeasure]);

    return React.createElement(WrappedComponent, props);
  };
  
  return PerformanceTrackedComponent;
}
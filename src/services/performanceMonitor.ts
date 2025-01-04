// src/services/performanceMonitor.ts
interface PerformanceMetric {
  name: string;
  startTime: number;
  duration?: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private activeOperations: Map<string, PerformanceMetric> = new Map();

  startOperation(name: string, metadata?: Record<string, any>): string {
    const id = `${name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    this.activeOperations.set(id, {
      name,
      startTime: performance.now(),
      metadata
    });

    return id;
  }

  endOperation(id: string): number | undefined {
    const operation = this.activeOperations.get(id);
    if (!operation) return;

    const duration = performance.now() - operation.startTime;
    operation.duration = duration;

    if (!this.metrics.has(operation.name)) {
      this.metrics.set(operation.name, []);
    }
    this.metrics.get(operation.name)?.push(operation);
    this.activeOperations.delete(id);

    return duration;
  }

  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.get(name) || [];
    }
    
    return Array.from(this.metrics.values()).flat();
  }

  getAverageTime(name: string): number {
    const metrics = this.metrics.get(name) || [];
    if (metrics.length === 0) return 0;

    const totalTime = metrics.reduce((sum, metric) => 
      sum + (metric.duration || 0), 0);
    
    return totalTime / metrics.length;
  }

  clear(): void {
    this.metrics.clear();
    this.activeOperations.clear();
  }

  async measure<T>(
    name: string, 
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const id = this.startOperation(name, metadata);
    try {
      const result = await operation();
      this.endOperation(id);
      return result;
    } catch (error) {
      this.endOperation(id);
      throw error;
    }
  }

  async * measureIterator<T>(
    name: string,
    iterator: AsyncIterableIterator<T>,
    metadata?: Record<string, any>
  ): AsyncIterableIterator<T> {
    const id = this.startOperation(name, metadata);
    try {
      for await (const value of iterator) {
        yield value;
      }
    } finally {
      this.endOperation(id);
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();
// src/services/cache.ts

interface CacheItem<T> {
  value: T;
  timestamp: number;
  expiry: number;
  key: string;
}

interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
  missRate: number;
  averageAge: number;
}

interface SearchFilters {
  contentTypes: string[];
  authors: string[];
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
}

class CacheService {
  private cache: Map<string, CacheItem<any>>;
  private readonly maxSize: number;
  private readonly defaultTTL: number;
  private readonly vectorTTL: number;
  private hits: number = 0;
  private misses: number = 0;
  private readonly sortedItems: CacheItem<any>[] = [];

  constructor(maxSize = 1000, defaultTTL = 1800000) { // 30 minutes default TTL
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    this.vectorTTL = 24 * 60 * 60 * 1000; // 24 hours for vectors
  }

  private enforceMaxSize(): void {
    if (this.cache.size <= this.maxSize) return;

    // Sort items by timestamp
    const items = Array.from(this.cache.entries())
      .map(([key, item]) => ({ ...item, key }))
      .sort((a, b) => a.timestamp - b.timestamp);

    // Remove oldest items until we're under max size
    while (items.length > this.maxSize) {
      const item = items.shift();
      if (item) {
        this.cache.delete(item.key);
      }
    }
  }

  set<T>(key: string, value: T, ttl = this.defaultTTL): void {
    const item: CacheItem<T> = {
      value,
      timestamp: Date.now(),
      expiry: ttl,
      key
    };

    this.cache.set(key, item);
    this.enforceMaxSize();
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      this.misses++;
      return null;
    }

    const now = Date.now();
    if (now - item.timestamp > item.expiry) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return item.value as T;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    const now = Date.now();
    if (now - item.timestamp > item.expiry) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  setVectorEmbedding(text: string, embedding: number[]): void {
    const key = `vector:${text}`;
    this.set(key, embedding, this.vectorTTL);
  }

  getVectorEmbedding(text: string): number[] | null {
    const key = `vector:${text}`;
    return this.get(key);
  }

  setSearchResults(query: string, filters: SearchFilters, results: any[]): void {
    const key = this.createSearchKey(query, filters);
    this.set(key, results);
  }

  getSearchResults(query: string, filters: SearchFilters): any[] | null {
    const key = this.createSearchKey(query, filters);
    return this.get(key);
  }

  private createSearchKey(query: string, filters: SearchFilters): string {
    return `search:${query}:${JSON.stringify(filters)}`;
  }

  cleanExpired(): number {
    const now = Date.now();
    let count = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.expiry) {
        this.cache.delete(key);
        count++;
      }
    }

    return count;
  }

  getStats(): CacheStats {
    const now = Date.now();
    const ages = Array.from(this.cache.values())
      .map(item => now - item.timestamp);

    const totalRequests = this.hits + this.misses;
    
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: totalRequests ? this.hits / totalRequests : 0,
      missRate: totalRequests ? this.misses / totalRequests : 0,
      averageAge: ages.length ? ages.reduce((a, b) => a + b, 0) / ages.length : 0
    };
  }
}

export const cacheService = new CacheService();
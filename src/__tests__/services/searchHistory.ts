// src/services/searchHistory.ts
export interface SearchHistoryItem {
  query: string;
  results: number;
  timestamp: number;
  filters: {
    contentTypes: string[];
    authors: string[];
  };
}

class SearchHistoryServiceImpl {
  private history: SearchHistoryItem[] = [];
  private readonly maxSize = 100;
  private readonly storageKey = 'searchHistory';

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.history = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading search history:', error);
      this.history = [];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.history));
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  }

  add(item: SearchHistoryItem) {
    // Remove duplicates
    this.history = this.history.filter(h => h.query !== item.query);
    
    // Add new item at the start
    this.history.unshift(item);
    
    // Maintain max size
    if (this.history.length > this.maxSize) {
      this.history = this.history.slice(0, this.maxSize);
    }
    
    this.saveToStorage();
  }

  getAll() {
    return [...this.history];
  }

  clear() {
    this.history = [];
    localStorage.removeItem(this.storageKey);
  }

  filterByDateRange(start: Date, end: Date) {
    return this.history.filter(item => {
      const itemDate = new Date(item.timestamp);
      return itemDate >= start && itemDate <= end;
    });
  }
}

export const searchHistoryService = new SearchHistoryServiceImpl();
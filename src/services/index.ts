// src/services/index.ts
export * from './fileProcessing';
export * from './api';
export * from './searchHistory';
export * from './uploadService';
export * from './analytics';
export * from './websocket';
export * from './performanceMonitor';
export * from './logger';
export * from './cache';
export * from './mockApi';

// Handle potential duplicate exports by using explicit imports and re-exports
import { searchService as search } from './search';
import { searchService } from './searchService';
import { documentService as docs } from './document';
import { documentService } from './documentService';

// Export both versions of services (will prefer newer ones when imported with *)
export { search, searchService, docs, documentService };
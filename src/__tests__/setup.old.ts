// src/__tests__/setup.ts
import '@testing-library/jest-dom';
import { vi, beforeAll, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { expect } from 'vitest';

// Extend Vitest's expect method with testing-library methods
expect.extend(matchers);

// Environment variables
process.env.VITE_API_URL = 'http://localhost:3000';
process.env.VITE_WS_URL = 'ws://localhost:3001';

// Mock IntersectionObserver
class IntersectionObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
  root = null;
  rootMargin = '';
  thresholds = [];
  takeRecords = vi.fn();
}

global.IntersectionObserver = IntersectionObserver;

// Mock ResizeObserver
class ResizeObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

global.ResizeObserver = ResizeObserver;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
  removeItem: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock scrollTo
window.scrollTo = vi.fn();

// Mock window.URL.createObjectURL
window.URL.createObjectURL = vi.fn();
window.URL.revokeObjectURL = vi.fn();

// Mock HTMLCanvasElement methods
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(() => ({
    data: new Array(4),
  })),
  putImageData: vi.fn(),
  createImageData: vi.fn(),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  translate: vi.fn(),
  transform: vi.fn(),
  beginPath: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  fill: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  arc: vi.fn(),
}));

// Clean up after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Global fetch mock
global.fetch = vi.fn();

// Mock crypto
Object.defineProperty(window, 'crypto', {
  value: {
    getRandomValues: (arr: any) => {
      return crypto.getRandomValues(arr);
    },
    subtle: {
      digest: vi.fn(),
      encrypt: vi.fn(),
      decrypt: vi.fn(),
      sign: vi.fn(),
      verify: vi.fn(),
      generateKey: vi.fn(),
      deriveKey: vi.fn(),
      deriveBits: vi.fn(),
      importKey: vi.fn(),
      exportKey: vi.fn(),
      wrapKey: vi.fn(),
      unwrapKey: vi.fn(),
    },
  }
});

// Console error/warn capture and suppression if needed
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      /Warning.*not wrapped in act/.test(args[0]) ||
      /Warning.*cannot update a component/.test(args[0])
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args: any[]) => {
    if (/Warning.*not wrapped in act/.test(args[0])) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

// Mock UI components
vi.mock('@/components/ui/card', () => {
  const { Card, CardHeader, CardTitle, CardContent } = require('./mocks/ui-components');
  return {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
  };
});

vi.mock('@/components/ui/button', () => {
  const { Button } = require('./mocks/ui-components');
  return { Button };
});

vi.mock('@/components/ui/input', () => {
  const { Input } = require('./mocks/ui-components');
  return { Input };
});

// File mock
global.File = class MockFile {
  name: string;
  size: number;
  type: string;
  lastModified: number;

  constructor(
    parts: (string | Blob | ArrayBuffer)[],
    filename: string,
    properties?: FilePropertyBag
  ) {
    this.name = filename;
    this.size = parts.reduce((acc, part) => acc + (part as any).length || 0, 0);
    this.type = properties?.type || '';
    this.lastModified = properties?.lastModified || Date.now();
  }
};

// Add any missing DOM properties
Object.defineProperty(document.body, 'clientWidth', { value: 1024 });
Object.defineProperty(document.body, 'clientHeight', { value: 768 });

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn(),
    readText: vi.fn(),
  },
});

// Mock window.location
delete window.location;
window.location = {
  href: 'http://localhost:3000',
  pathname: '/',
  search: '',
  hash: '',
  host: 'localhost:3000',
  hostname: 'localhost',
  protocol: 'http:',
  port: '3000',
  origin: 'http://localhost:3000',
  assign: vi.fn(),
  replace: vi.fn(),
  reload: vi.fn(),
} as any;
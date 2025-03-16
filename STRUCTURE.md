# Modern Search Engine Project Structure

This document outlines the organization of the Modern Search Engine project to help developers understand the codebase.

## Directory Structure

```
modern-search-engine/
├── backend/                   # Rust-based backend code
│   └── src/                   # Backend source files
├── docs/                      # Documentation
├── migrations/                # Database migrations
├── scripts/                   # Utility scripts
├── src/                       # Frontend TypeScript/React code
│   ├── components/            # UI components
│   │   ├── document/          # Document-related components
│   │   ├── search/            # Search-related components
│   │   ├── ui/                # Reusable UI components
│   │   └── upload/            # Upload-related components
│   ├── contexts/              # React context providers
│   ├── hooks/                 # Custom React hooks
│   ├── pages/                 # Page components
│   ├── services/              # Service modules
│   ├── styles/                # CSS and style files
│   └── utils/                 # Utility functions
├── tests/                     # Backend tests
└── ui/                        # Legacy UI code (to be consolidated)
```

## Main Components

### Document Components

- `DocumentUpload.tsx` - Handles file uploads with drag and drop
- `ProcessingStatus.tsx` - Displays document processing status
- `PdfDisplay.tsx` - PDF viewer component

### Search Components

- `SearchBar.tsx` - Search input with autocomplete, supporting keyboard shortcuts and ref forwarding
- `SearchResultList.tsx` - Displays search results with expandable details
- `ResponsiveSearch.tsx` - Responsive search interface with filtering and advanced features
- `SearchFilters.tsx` - Provides filtering options for search results
- `SearchHistory.tsx` - Manages and displays search history
- `SearchAnalytics.tsx` - Displays performance metrics about search operations
- `SearchHistoryManager.tsx` - Handles search history persistence

### Services

- `api.ts` - Core API client with request management, retries, and error handling
- `search.ts` - Original search service implementation
- `searchService.ts` - New search service with highlighting and improved parsing
- `fileProcessing.ts` - Processes uploaded files and handles file conversions
- `documentService.ts` - Handles document operations and metadata extraction
- `searchHistory.ts` - Manages search history, persistence, and retrieval
- `errorService.ts` - Centralized error handling and standardization
- `cache.ts` - Caching service for search results and assets
- `analytics.ts` - Collects and reports usage metrics
- `logger.ts` - Universal logging service with multiple log levels
- `websocket.ts` - Real-time communication for document status updates

## Test Structure

- Unit tests for components in `__tests__/unit/`
- Service tests in `__tests__/services/`
- Integration tests in `__tests__/integration/`

## Import Guidelines

- Use barrel exports (index.ts files) for importing components:
  ```typescript
  // Good
  import { DocumentUpload, ProcessingStatus } from '@/components/document';
  
  // Avoid
  import DocumentUpload from '@/components/document/DocumentUpload';
  import ProcessingStatus from '@/components/document/ProcessingStatus';
  ```

- Use absolute imports with the '@' alias:
  ```typescript
  // Good
  import { searchService } from '@/services';
  
  // Avoid
  import { searchService } from '../../services/searchService';
  ```

## Code Style Guidelines

- Use TypeScript interfaces for component props
- Follow the naming convention:
  - Components: PascalCase (e.g., `DocumentUpload`)
  - Files: PascalCase for components, camelCase for services
  - Functions: camelCase
- Prefer functional components with hooks over class components
- Use async/await for asynchronous code

## Organization Guidelines

- Keep each component in its own file
- Use barrel exports (index.ts) for each directory
- Group related components in subdirectories
- Use absolute imports with '@/' prefix
- Put reusable UI components in the `ui/` directory
- Keep page components separate from UI components
- Follow a consistent directory structure:
  - `components/`: Reusable React components
  - `pages/`: Top-level page components
  - `services/`: Business logic and API calls
  - `hooks/`: Reusable React hooks
  - `contexts/`: React context providers
  - `types/`: TypeScript interfaces and types
  - `utils/`: Utility functions
  - `__tests__/`: Test files

### Hooks

- `useSearch.ts` - Main search hook with comprehensive search functionality
- `useSearchAPI.ts` - API-focused search hook with debouncing and error handling
- `useDebounce.ts` - Debounce hook for UI interactions and API calls
- `useKeyboardShortcuts.ts` - Hook for registering and handling keyboard shortcuts
- `useDocumentUpload.ts` - Hook for handling document uploads
- `usePerformance.ts` - Hook for tracking and reporting performance metrics
- `useGitChanges.ts` - Hook for monitoring repository changes during development

## UI Components

- `button.tsx` - Reusable button component with various styles
- `card.tsx` - Card container with various usage patterns
- `input.tsx` - Input components with accessibility features
- `metrics.tsx` - Metric display components with tooltips
- `toast.tsx` - Toast notification system for feedback
- `sheet.tsx` - Slide-in panel component for mobile interfaces

## Next Steps

1. Implement full search history in the responsive UI
2. Add pagination for large result sets
3. Optimize mobile experience with touch interactions
4. Continue cleaning up duplicate files in ui/ directory
5. Fix remaining TypeScript errors in test files
6. Add comprehensive tests for the responsive search components
7. Add automated visual regression testing
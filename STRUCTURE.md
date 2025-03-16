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

- `SearchBar.tsx` - Search input with autocomplete
- `SearchResults.tsx` - Displays search results
- `SearchFilters.tsx` - Provides filtering options
- `SearchHistory.tsx` - Manages search history
- `SearchAnalytics.tsx` - Displays search metrics

### Services

- `fileProcessing.ts` - Processes uploaded files
- `searchService.ts` - Manages search functionality
- `documentService.ts` - Handles document operations
- `searchHistory.ts` - Manages search history
- `api.ts` - API client for backend communication

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
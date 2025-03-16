# Modern Search Engine Component Hierarchy

This document outlines the component hierarchy of the Modern Search Engine project to help developers understand the relationships between components.

## Page Components

These are top-level components that represent entire pages in the application.

- **Search.tsx** - Main search page that integrates search, upload, and result display
- **Upload.tsx** - Dedicated document upload page with file drop functionality
- **UploadContainer.tsx** - Container for document uploads with progress tracking

## Document Components

Document-related components for uploading, displaying, and processing files.

```
document/
├── DocumentUpload.tsx         - Drag and drop file upload component
├── AdvancedDocumentUpload.tsx - Enhanced document upload with more options
├── DocumentPreview.tsx        - Preview documents with zoom and rotate controls
├── PdfDisplay.tsx             - PDF viewer component
└── ProcessingStatus.tsx       - Status display for document processing
```

## Search Components

Components related to search functionality and result display.

```
search/
├── SearchBar.tsx              - Main search input with filters and suggestions (supports ref forwarding)
├── SearchInput.tsx            - Basic search input field (simplest version)
├── SearchFilters.tsx          - Advanced search filters (standalone component)
├── ResponsiveSearch.tsx       - Responsive search interface with integrated filters and results
├── SearchResultList.tsx       - Display search results with expandable details
├── SearchResultComparison.tsx - Compare similar search results side by side
├── SearchHistory.tsx          - Display search history items and enable reuse
├── SearchHistoryManager.tsx   - Manage search history with export/clear/import functionality
└── SearchAnalytics.tsx        - Display search analytics and performance metrics
```

## UI Components

Reusable UI components that follow a consistent design system.

```
ui/
├── button.tsx                 - Button component with variants
├── card.tsx                   - Card container component
├── input.tsx                  - Input field component
├── sheet.tsx                  - Sheet/drawer component
└── metrics.tsx                - Metrics display card
```

## Component Relationships

### Classic Search Flow

```
Search Page
├── SearchBar
│   ├── SearchInput
│   └── SearchFilters
├── SearchResultList
├── SearchHistory
└── MetricCard (from ui/metrics.tsx)
```

### Responsive Search Flow

```
Search Page
└── ResponsiveSearch
    ├── SearchBar (with ref forwarding)
    ├── Filter Panel
    │   └── Filter Components (custom checkboxes, date inputs)
    ├── Active Filters Display
    │   └── Filter Chips (removable)
    ├── SearchResultList
    ├── MetricCard (enhanced with tooltips)
    └── Toast (for keyboard shortcuts)
```

### Upload Flow

```
Upload Page
└── DocumentUpload

UploadContainer
├── DocumentUpload
└── ProcessingStatus
```

### Document Preview Flow

```
DocumentPreview
└── PdfDisplay (for PDF files)
```

### Hooks and Services

```
ResponsiveSearch
├── useSearchAPI
│   ├── useDebounce
│   ├── useError (from ErrorContext)
│   └── api.ts
├── useKeyboardShortcuts
└── search filters state

SearchBar
└── useRef (for focus management)

SearchResultList
└── search result rendering with expandable details
```

## Key Patterns and Principles

- All components use absolute imports with the '@/' prefix
- Components are grouped logically by feature area
- UI components are used across feature areas to maintain consistency
- Each component has a single responsibility
- Pages combine multiple components to create full features
- Prefer hooks for shared stateful logic
- Use context for global state management
- Forward refs when a parent needs to control child focus

## Best Practices

- Use TypeScript interfaces for component props
- Use barrel exports (index.ts) for component directories
- Use custom hooks for complex logic
- Use error boundaries for error handling at the appropriate level
- Implement proper accessibility with ARIA attributes
- Use keyboard shortcuts for power users
- Responsive design for all screen sizes
- Debounce for expensive operations like search
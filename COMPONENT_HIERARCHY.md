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
├── SearchBar.tsx              - Main search input with filters and suggestions
├── SearchInput.tsx            - Basic search input field
├── SearchFilters.tsx          - Advanced search filters
├── SearchResultList.tsx       - Display search results
├── SearchResultComparison.tsx - Compare similar search results
├── SearchHistory.tsx          - Display search history items
├── SearchHistoryManager.tsx   - Manage search history with export/clear
└── SearchAnalytics.tsx        - Display search analytics and metrics
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

### Search Flow

```
Search Page
├── SearchBar
│   ├── SearchInput
│   └── SearchFilters
├── SearchResultList
├── SearchHistory
└── MetricCard (from ui/metrics.tsx)
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

## Notes

- All components use absolute imports with the '@/' prefix
- Components are grouped logically by feature area
- UI components are used across feature areas to maintain consistency
- Each component should have a single responsibility
- Pages combine multiple components to create full features
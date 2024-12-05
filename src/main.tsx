// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { SearchProvider } from './contexts/SearchContext'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SearchProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </SearchProvider>
  </React.StrictMode>,
)

// src/App.tsx
import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Search from './pages/Search';
import Upload from './pages/Upload';

const App = () => {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link to="/" className="text-xl font-bold">
                Search Engine v2
              </Link>
              <div className="ml-10 flex items-center space-x-4">
                <Link
                  to="/"
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  Search
                </Link>
                <Link
                  to="/upload"
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  Upload
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Search />} />
          <Route path="/upload" element={<Upload />} />
        </Routes>
      </main>

      <footer className="border-t">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          Modern Search Engine v2 &copy; 2024
        </div>
      </footer>
    </div>
  );
};

export default App;

// src/types.ts
export interface SearchResult {
  id: string;
  title: string;
  content: string;
  author?: string;
  tags: string[];
  scores: {
    text_score: number;
    vector_score: number;
    final_score: number;
    field_scores: Array<{
      field: string;
      score: number;
      weight: number;
    }>;
  };
  matches: Array<{
    field: string;
    term: string;
    count: number;
  }>;
  highlights: string[];
  metadata: {
    source_type: string;
    word_count: number;
    created_at: string;
    last_modified: string;
  };
}

export interface SearchAnalytics {
  execution_time_ms: number;
  total_results: number;
  max_score: number;
  search_type: string;
  vector_query: boolean;
  field_weights: Record<string, number>;
  query_analysis: {
    original: string;
    expanded: string;
    tokens: string[];
    stopwords_removed: string[];
  };
  performance: {
    vector_time_ms: number;
    text_time_ms: number;
    total_time_ms: number;
    result_count: number;
  };
}

export interface SearchFilters {
  author?: string;
  dateRange?: {
    from: Date | null;
    to: Date | null;
  };
  contentType?: string[];
  tags?: string[];
}

export interface SearchOptions {
  useVector: boolean;
  boost: {
    title: number;
    content: number;
    tags: number;
  };
}

export interface ProcessingStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message?: string;
  result?: ProcessedDocument;
}

export interface ProcessedDocument {
  id: string;
  title: string;
  content_type: string;
  word_count: number;
  language?: string;
  processing_time_ms: number;
  metadata: {
    source_type: string;
    author?: string;
    tags: string[];
  };
}

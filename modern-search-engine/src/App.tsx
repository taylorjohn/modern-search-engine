// src/App.tsx
import React from 'react';
import { Search } from './pages/Search';
import { Upload } from './pages/Upload';

function App() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <div className="text-xl font-bold">Search Engine v2</div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-sm font-medium transition-colors hover:text-primary">
                Search
              </button>
              <button className="text-sm font-medium transition-colors hover:text-primary">
                Upload
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <Search />
      </main>
    </div>
  );
}

export default App;
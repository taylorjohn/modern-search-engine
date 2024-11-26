import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Search from './pages/Search';
import Upload from './pages/Upload';

const App: React.FC = () => {
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
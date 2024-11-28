// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Search from './pages/Search';
import Upload from './pages/Upload';

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm">
          <div className="container mx-auto px-4">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center">
                <Link to="/" className="text-xl font-bold text-gray-900">
                  Modern Search
                </Link>
                <div className="ml-10 flex items-center space-x-4">
                  <Link
                    to="/"
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    Search
                  </Link>
                  <Link
                    to="/upload"
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    Upload
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Search />} />
            <Route path="/upload" element={<Upload />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t mt-auto">
          <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-600">
            Modern Search Engine &copy; 2024
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;
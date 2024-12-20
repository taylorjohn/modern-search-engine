// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Search from './pages/Search';
import Upload from './pages/Upload';
import Navigation from './components/Navigation';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="py-6">
          <Routes>
            <Route path="/" element={<Search />} />
            <Route path="/upload" element={<Upload />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
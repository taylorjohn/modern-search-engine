// src/components/Navigation.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Upload } from 'lucide-react';

export default function Navigation() {
  const location = useLocation();
  
  return (
    <nav className="border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center h-16">
          <div className="flex gap-6">
            <Link
              to="/"
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium
                ${location.pathname === '/' 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                }`}
            >
              <Search className="h-4 w-4" />
              Search
            </Link>
            <Link
              to="/upload"
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium
                ${location.pathname === '/upload' 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                }`}
            >
              <Upload className="h-4 w-4" />
              Upload
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
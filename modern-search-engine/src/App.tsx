// src/App.tsx
import React, { useState, useEffect } from 'react';
import { Search } from './pages/Search';
import { Upload } from './pages/Upload';

// Sample document type
interface Document {
  id: string;
  title: string;
  content: string;
  type: string;
  dateAdded: Date;
}

function App() {
  const [currentPage, setCurrentPage] = useState<'search' | 'upload'>('search');
  const [documents, setDocuments] = useState<Document[]>([]);
  
  // Load any existing documents from localStorage on mount
  useEffect(() => {
    const savedDocs = localStorage.getItem('searchEngineDocuments');
    if (savedDocs) {
      try {
        setDocuments(JSON.parse(savedDocs));
      } catch (e) {
        console.error('Failed to parse saved documents', e);
      }
    }
  }, []);
  
  // Save documents to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('searchEngineDocuments', JSON.stringify(documents));
  }, [documents]);

  // Handle document upload
  const handleDocumentUpload = (files: File[]) => {
    // Process each file and add it to the documents array
    const filePromises = files.map(file => {
      return new Promise<Document>((resolve) => {
        // Create a file reader to read the file contents
        const reader = new FileReader();
        
        reader.onload = (e) => {
          // Create a new document from the file
          const newDoc: Document = {
            id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: file.name,
            content: e.target?.result as string || '',
            type: file.type,
            dateAdded: new Date()
          };
          
          resolve(newDoc);
        };
        
        // Read the file as text
        reader.readAsText(file);
      });
    });
    
    // Add all new documents to the state
    Promise.all(filePromises).then(newDocs => {
      setDocuments(prev => [...prev, ...newDocs]);
      // Switch to search page after upload completes
      setCurrentPage('search');
    });
    
    return true; // Return success
  };

  // Handle document search
  const handleDocumentSearch = (query: string) => {
    // This is a more advanced search implementation with scoring
    if (!query.trim()) return [];
    
    const searchTerms = query.toLowerCase().split(' ');
    const results = [];
    
    for (const doc of documents) {
      const content = doc.content.toLowerCase();
      const title = doc.title.toLowerCase();
      
      // Calculate various scores
      let scores = {
        titleExactMatch: 0,
        titlePartialMatch: 0,
        contentExactMatch: 0,
        contentPartialMatch: 0,
        termFrequency: 0,
        termProximity: 0
      };
      
      // Check for exact matches in title (highest value)
      if (title.includes(query.toLowerCase())) {
        scores.titleExactMatch = 1.0;
      }
      
      // Check for partial matches in title
      const titleMatchCount = searchTerms.filter(term => title.includes(term)).length;
      scores.titlePartialMatch = titleMatchCount / searchTerms.length * 0.7;
      
      // Check for exact matches in content
      if (content.includes(query.toLowerCase())) {
        scores.contentExactMatch = 0.8;
      }
      
      // Check for partial matches in content
      const contentMatchCount = searchTerms.filter(term => content.includes(term)).length;
      scores.contentPartialMatch = contentMatchCount / searchTerms.length * 0.5;
      
      // Term frequency analysis (how many times terms appear)
      let termCount = 0;
      searchTerms.forEach(term => {
        // Count occurrences of each term
        const regex = new RegExp(term, 'gi');
        const matches = content.match(regex) || [];
        termCount += matches.length;
      });
      // Normalize term frequency (max score of 0.6)
      scores.termFrequency = Math.min(termCount / 10, 1) * 0.6;
      
      // Term proximity (are the terms close to each other?)
      // Simple implementation for demo purposes
      if (searchTerms.length > 1) {
        // Higher score if multiple terms appear close together
        const firstTermIndex = content.indexOf(searchTerms[0]);
        if (firstTermIndex >= 0) {
          const proximity = searchTerms.slice(1).some(term => 
            content.indexOf(term, firstTermIndex) - firstTermIndex < 50
          );
          scores.termProximity = proximity ? 0.4 : 0;
        }
      }
      
      // Calculate final score (weighted sum)
      const finalScore = 
        scores.titleExactMatch +
        scores.titlePartialMatch +
        scores.contentExactMatch +
        scores.contentPartialMatch +
        scores.termFrequency +
        scores.termProximity;
      
      // Only include documents that have some match
      if (finalScore > 0) {
        const normalizedScore = Math.min(finalScore / 3, 1); // Normalize to 0-1 range
        
        results.push({
          ...doc,
          score: normalizedScore,
          scores: scores,
          matchDetails: {
            titleMatch: scores.titleExactMatch > 0 || scores.titlePartialMatch > 0,
            contentMatch: scores.contentExactMatch > 0 || scores.contentPartialMatch > 0,
            matchedTerms: searchTerms.filter(term => 
              title.includes(term) || content.includes(term)
            ),
            totalMatches: termCount
          }
        });
      }
    }
    
    // Sort results by score (highest first)
    return results.sort((a, b) => b.score - a.score);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <div className="text-xl font-bold text-primary">Search Engine v2</div>
            </div>
            <div className="flex items-center space-x-6">
              <button 
                className={`text-sm font-medium transition-colors ${currentPage === 'search' ? 'text-primary' : 'text-gray-600 hover:text-primary'}`}
                onClick={() => setCurrentPage('search')}
              >
                Search
              </button>
              <button 
                className={`text-sm font-medium transition-colors ${currentPage === 'upload' ? 'text-primary' : 'text-gray-600 hover:text-primary'}`}
                onClick={() => setCurrentPage('upload')}
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main>
        {currentPage === 'search' ? 
          <Search onSearch={handleDocumentSearch} documentCount={documents.length} /> : 
          <Upload onUpload={handleDocumentUpload} />
        }
      </main>
    </div>
  );
}

export default App;
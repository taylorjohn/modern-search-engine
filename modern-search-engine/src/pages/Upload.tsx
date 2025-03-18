import React, { useState, useRef, useCallback } from 'react';

interface UploadProps {
  onUpload: (files: File[]) => boolean;
}

export function Upload({ onUpload }: UploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
      setMessage(''); // Clear any previous messages
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles(Array.from(e.dataTransfer.files));
      setMessage(''); // Clear any previous messages
    }
  }, []);

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setMessage('Please select files to upload');
      return;
    }

    setUploading(true);
    setMessage('Processing files...');

    try {
      // Use the upload function from props
      const success = onUpload(files);
      
      if (success) {
        setMessage(`${files.length} file(s) added to the search index!`);
        setFiles([]);
      } else {
        setMessage('Failed to process files. Please try again.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setMessage('An error occurred while processing files.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6">Upload Documents</h1>
      
      <div 
        className={`card border-2 border-dashed ${dragActive ? 'border-primary bg-primary/5' : 'border-gray-300 bg-gray-50'} p-8 text-center transition-colors`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <div className="mb-6">
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
            id="fileInput"
            ref={fileInputRef}
            accept=".txt,.html,.md,.csv,.json,.xml,.doc,.docx,.pdf"
          />
          <label 
            htmlFor="fileInput" 
            className="btn btn-outline cursor-pointer inline-block mb-2"
          >
            Select Files
          </label>
          <p className="text-sm text-gray-500">or drag files here</p>
          <p className="text-xs text-gray-400 mt-2">
            Supported formats: TXT, HTML, MD, CSV, JSON, XML, DOC, DOCX, PDF
          </p>
        </div>
        
        <div className="mb-6">
          {files.length > 0 ? (
            <div>
              <p className="font-medium text-primary mb-2">{files.length} file(s) selected:</p>
              <ul className="text-left max-w-md mx-auto space-y-1">
                {files.map((file, index) => (
                  <li key={index} className="bg-white p-2 rounded-lg shadow-sm flex justify-between items-center">
                    <span className="truncate flex-1">{file.name}</span>
                    <span className="text-gray-500 text-sm mx-2">{Math.round(file.size / 1024)} KB</span>
                    <button 
                      className="text-red-500 hover:text-red-700 text-sm px-2 py-1 rounded-full hover:bg-red-50"
                      onClick={() => removeFile(index)}
                      title="Remove file"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-gray-500">No files selected</p>
          )}
        </div>
        
        <button
          onClick={handleUpload}
          disabled={uploading || files.length === 0}
          className={`btn ${files.length > 0 ? 'btn-primary' : 'btn-outline opacity-50 cursor-not-allowed'}`}
        >
          {uploading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : 'Add to Search Index'}
        </button>
        
        {message && (
          <div className={`mt-4 p-3 rounded-lg ${message.includes('added') ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
            {message}
          </div>
        )}
      </div>
      
      <div className="mt-8 card p-6 bg-gray-50">
        <h2 className="text-lg font-medium mb-2">How it works</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
          <li>Select or drag files to upload</li>
          <li>Click "Add to Search Index" to process the files</li>
          <li>The content will be indexed and made searchable</li>
          <li>Switch to the Search page to find content in your documents</li>
        </ol>
      </div>
    </div>
  );
}

export default Upload;
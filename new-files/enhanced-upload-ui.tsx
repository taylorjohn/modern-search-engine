import React, { useState, useCallback } from 'react';
import { Upload, FileText, Globe, File, X, AlertCircle } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

const DocumentUpload = () => {
  const [files, setFiles] = useState([]);
  const [htmlUrl, setHtmlUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);

  const handleFileDrop = useCallback((e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  }, []);

  const handleFileSelect = useCallback((e) => {
    const selectedFiles = Array.from(e.target.files);
    processFiles(selectedFiles);
  }, []);

  const processFiles = async (newFiles) => {
    setIsProcessing(true);
    const processed = [];

    for (const file of newFiles) {
      if (file.type === 'application/pdf' || file.type === 'text/html') {
        try {
          const base64Content = await fileToBase64(file);
          processed.push({
            type: file.type === 'application/pdf' ? 'pdf' : 'html',
            filename: file.name,
            base64_content: base64Content,
            size: file.size,
            lastModified: file.lastModified
          });
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
        }
      }
    }

    setFiles(current => [...current, ...processed]);
    setIsProcessing(false);
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result
          .replace('data:application/pdf;base64,', '')
          .replace('data:text/html;base64,', '');
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleHtmlUrlSubmit = async () => {
    if (!htmlUrl) return;

    setIsProcessing(true);
    try {
      const response = await fetch(htmlUrl);
      const html = await response.text();
      
      setFiles(current => [...current, {
        type: 'html',
        content: html,
        url: htmlUrl
      }]);
      
      setHtmlUrl('');
    } catch (error) {
      setUploadStatus({
        success: false,
        message: `Failed to fetch HTML from ${htmlUrl}: ${error.message}`
      });
    }
    setIsProcessing(false);
  };

  const removeFile = (index) => {
    setFiles(current => current.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    setIsProcessing(true);
    setUploadStatus(null);

    try {
      const response = await fetch('/api/documents/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(files),
      });

      if (!response.ok) throw new Error('Upload failed');

      const result = await response.json();
      setUploadStatus({
        success: true,
        message: `Successfully processed ${result.length} documents`,
      });
      setFiles([]);
    } catch (error) {
      setUploadStatus({
        success: false,
        message: error.message,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* File Drop Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4"
          >
            <input
              type="file"
              onChange={handleFileSelect}
              accept=".pdf,.html"
              multiple
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer text-blue-500 hover:text-blue-700"
            >
              <FileText className="w-12 h-12 mx-auto mb-2" />
              <div className="text-lg font-medium">
                Drop PDF or HTML files here or click to upload
              </div>
              <div className="text-sm text-gray-500">
                Supports PDF and HTML files
              </div>
            </label>
          </div>

          {/* HTML URL Input */}
          <div className="mb-4">
            <div className="flex gap-2">
              <input
                type="url"
                value={htmlUrl}
                onChange={(e) => setHtmlUrl(e.target.value)}
                placeholder="Enter HTML URL"
                className="flex-1 p-2 border rounded"
              />
              <button
                onClick={handleHtmlUrlSubmit}
                disabled={!htmlUrl || isProcessing}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
              >
                <Globe className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-2">
              <div className="font-medium">Selected Files:</div>
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                >
                  <div className="flex items-center gap-2">
                    {file.type === 'pdf' ? (
                      <FileText className="w-4 h-4" />
                    ) : (
                      <Globe className="w-4 h-4" />
                    )}
                    <span>{file.filename || file.url}</span>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <button
            onClick={handleUpload}
            disabled={files.length === 0 || isProcessing}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            <Upload className="w-5 h-5" />
            {isProcessing ? 'Processing...' : 'Process Documents'}
          </button>
        </CardFooter>
      </Card>

      {uploadStatus && (
        <div className={`p-4 rounded flex items-center gap-2 ${
          uploadStatus.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <AlertCircle className="w-5 h-5" />
          {uploadStatus.message}
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;

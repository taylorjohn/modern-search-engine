import React, { useState } from 'react';
import { Upload, Plus, X, FileText, Tag as TagIcon } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

const DocumentUpload = () => {
  const [documents, setDocuments] = useState([{
    title: '',
    content: '',
    author: '',
    tags: [],
    metadata: {}
  }]);
  const [currentTag, setCurrentTag] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);

  const addDocument = () => {
    setDocuments([...documents, {
      title: '',
      content: '',
      author: '',
      tags: [],
      metadata: {}
    }]);
  };

  const removeDocument = (index) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const updateDocument = (index, field, value) => {
    const newDocs = [...documents];
    newDocs[index] = { ...newDocs[index], [field]: value };
    setDocuments(newDocs);
  };

  const addTag = (index) => {
    if (currentTag.trim()) {
      const newDocs = [...documents];
      newDocs[index].tags = [...newDocs[index].tags, currentTag.trim()];
      setDocuments(newDocs);
      setCurrentTag('');
    }
  };

  const removeTag = (docIndex, tagIndex) => {
    const newDocs = [...documents];
    newDocs[docIndex].tags = newDocs[docIndex].tags.filter((_, i) => i !== tagIndex);
    setDocuments(newDocs);
  };

  const handleUpload = async () => {
    setIsUploading(true);
    setUploadStatus(null);

    try {
      const response = await fetch('/api/documents/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(documents),
      });

      if (!response.ok) throw new Error('Upload failed');

      const result = await response.json();
      setUploadStatus({
        success: true,
        message: `Successfully uploaded ${result.length} documents`,
      });
      setDocuments([{
        title: '',
        content: '',
        author: '',
        tags: [],
        metadata: {}
      }]);
    } catch (error) {
      setUploadStatus({
        success: false,
        message: error.message,
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Add Documents</h1>
        <button
          onClick={addDocument}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <Plus className="w-4 h-4" />
          Add Document
        </button>
      </div>

      {documents.map((doc, index) => (
        <Card key={index} className="mb-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Document {index + 1}
            </CardTitle>
            {documents.length > 1 && (
              <button
                onClick={() => removeDocument(index)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                value={doc.title}
                onChange={(e) => updateDocument(index, 'title', e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Document title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Content</label>
              <textarea
                value={doc.content}
                onChange={(e) => updateDocument(index, 'content', e.target.value)}
                className="w-full p-2 border rounded h-32"
                placeholder="Document content"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Author</label>
              <input
                type="text"
                value={doc.author}
                onChange={(e) => updateDocument(index, 'author', e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Document author"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {doc.tags.map((tag, tagIndex) => (
                  <span
                    key={tagIndex}
                    className="inline-flex items-center bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded"
                  >
                    <TagIcon className="w-3 h-3 mr-1" />
                    {tag}
                    <button
                      onClick={() => removeTag(index, tagIndex)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag(index)}
                  className="flex-1 p-2 border rounded"
                  placeholder="Add a tag"
                />
                <button
                  onClick={() => addTag(index)}
                  className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Add
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {uploadStatus && (
        <div className={`p-4 mb-4 rounded ${
          uploadStatus.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {uploadStatus.message}
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={isUploading}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        <Upload className="w-5 h-5" />
        {isUploading ? 'Uploading...' : 'Upload Documents'}
      </button>
    </div>
  );
};

export default DocumentUpload;

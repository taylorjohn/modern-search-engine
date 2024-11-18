import React, { useState } from 'react';
import { 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut,
  RotateCw,
  Download
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DocumentPreviewProps {
  document: {
    id: string;
    title: string;
    content_type: string;
    content: string;
    page_count?: number;
    current_page?: number;
    thumbnail_url?: string;
    download_url?: string;
  };
  onClose?: () => void;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  document,
  onClose,
}) => {
  const [currentPage, setCurrentPage] = useState(document.current_page || 1);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    if (document.page_count) {
      setCurrentPage(prev => Math.min(prev + 1, document.page_count));
    }
  };

  const renderContent = () => {
    switch (document.content_type) {
      case 'pdf':
        return (
          <iframe
            src={`/api/documents/${document.id}/preview?page=${currentPage}`}
            className="w-full h-[600px] border rounded"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transformOrigin: 'center center',
            }}
          />
        );
      case 'html':
        return (
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: document.content }}
            style={{
              zoom: zoom / 100,
              transform: `rotate(${rotation}deg)`,
            }}
          />
        );
      default:
        return (
          <pre
            className="whitespace-pre-wrap font-mono text-sm p-4 bg-gray-50 rounded"
            style={{
              zoom: zoom / 100,
              transform: `rotate(${rotation}deg)`,
            }}
          >
            {document.content}
          </pre>
        );
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {document.title}
        </CardTitle>
        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoom <= 50}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm w-16 text-center">{zoom}%</span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            disabled={zoom >= 200}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          {/* Rotation Control */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRotate}
          >
            <RotateCw className="h-4 w-4" />
          </Button>

          {/* Download Button */}
          {document.download_url && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(document.download_url, '_blank')}
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="relative">
        {/* Page Navigation */}
        {document.page_count && document.page_count > 1 && (
          <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-4 pointer-events-none">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={currentPage <= 1}
              className="pointer-events-auto"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage >= document.page_count}
              className="pointer-events-auto"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Document Content */}
        <div className="overflow-auto">
          {renderContent()}
        </div>

        {/* Page Counter */}
        {document.page_count && document.page_count > 1 && (
          <div className="text-center mt-4 text-sm text-gray-500">
            Page {currentPage} of {document.page_count}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentPreview;
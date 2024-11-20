import React from 'react';
import { Loader2, CheckCircle, XCircle, AlertTriangle, FileText, BarChart } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ProcessingResult {
  title: string;
  content_type: string;
  word_count: number;
  vector_embedding: number[];
  language?: string;
  processing_time_ms: number;
  metadata: {
    source_type: string;
    author?: string;
    tags: string[];
  };
}

interface ProcessingStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message?: string;
  result?: ProcessingResult;
  error?: string;
}

interface Props {
  status: ProcessingStatus;
  onRetry?: () => void;
  showDetails?: boolean;
}

const ProcessingStatus: React.FC<Props> = ({ 
  status, 
  onRetry,
  showDetails = true 
}) => {
  const StatusIcon = () => {
    switch (status.status) {
      case 'pending':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status.status) {
      case 'pending': return 'text-yellow-500';
      case 'processing': return 'text-blue-500';
      case 'completed': return 'text-green-500';
      case 'failed': return 'text-red-500';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center gap-2">
            <StatusIcon />
            <span className={getStatusColor()}>
              {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
            </span>
          </CardTitle>
          <span className="text-sm text-gray-500">
            ID: {status.id}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>{status.message || `${status.status}...`}</span>
              <span>{Math.round(status.progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  status.status === 'failed'
                    ? 'bg-red-500'
                    : status.status === 'completed'
                    ? 'bg-green-500'
                    : 'bg-blue-500'
                }`}
                style={{ width: `${status.progress}%` }}
              />
            </div>
          </div>

          {/* Error Message */}
          {status.error && (
            <div className="p-3 bg-red-50 rounded-lg text-red-600 text-sm">
              {status.error}
              {onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  className="mt-2"
                >
                  Retry Processing
                </Button>
              )}
            </div>
          )}

          {/* Processing Results */}
          {showDetails && status.result && (
            <div className="space-y-4 pt-4 border-t">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="text-gray-500">Document Type:</div>
                <div>{status.result.content_type}</div>
                
                <div className="text-gray-500">Word Count:</div>
                <div>{status.result.word_count.toLocaleString()}</div>
                
                {status.result.language && (
                  <>
                    <div className="text-gray-500">Language:</div>
                    <div>{status.result.language}</div>
                  </>
                )}
                
                <div className="text-gray-500">Processing Time:</div>
                <div>{status.result.processing_time_ms}ms</div>
                
                {status.result.metadata.author && (
                  <>
                    <div className="text-gray-500">Author:</div>
                    <div>{status.result.metadata.author}</div>
                  </>
                )}
              </div>

              {/* Vector Embedding Visualization */}
              {status.result.vector_embedding && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <BarChart className="h-4 w-4" />
                    Vector Embedding
                  </div>
                  <div className="h-8 bg-gray-100 rounded overflow-hidden">
                    {status.result.vector_embedding.slice(0, 50).map((value, i) => (
                      <div
                        key={i}
                        className="inline-block h-full w-1 bg-blue-500"
                        style={{
                          opacity: Math.abs(value),
                          marginRight: '1px'
                        }}
                      />
                    ))}
                    {status.result.vector_embedding.length > 50 && (
                      <span className="text-xs text-gray-500 ml-2">
                        +{status.result.vector_embedding.length - 50} more dimensions
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Tags */}
              {status.result.metadata.tags.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Tags</div>
                  <div className="flex flex-wrap gap-2">
                    {status.result.metadata.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-gray-100 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProcessingStatus;
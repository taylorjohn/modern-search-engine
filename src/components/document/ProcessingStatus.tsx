// src/components/document/ProcessingStatus.tsx
import React from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ProcessingStatusProps {
  status: {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    message: string;
    result?: any;
  };
}

const ProcessingStatus: React.FC<ProcessingStatusProps> = ({ status }) => {
  const getStatusIcon = () => {
    switch (status.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'processing':
      default:
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
    }
  };

  const displayMessage = status.message || (status.status === 'completed' ? 'Processing complete' : '');

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2" data-testid="processing-status">
          {getStatusIcon()}
          <span className="font-medium" data-testid="status-message">{displayMessage}</span>
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between text-sm text-gray-600">
            <span>{status.status}</span>
            <span>{status.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                status.status === 'failed' ? 'bg-red-500' :
                status.status === 'completed' ? 'bg-green-500' :
                'bg-blue-500'
              }`}
              style={{ width: `${status.progress}%` }}
              data-testid="progress-bar"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProcessingStatus;
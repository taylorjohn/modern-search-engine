import React from 'react';

interface ProcessingStatusProps {
  status: {
    id: string;
    status: string;
    progress: number;
    message: string;
  };
}

const ProcessingStatus: React.FC<ProcessingStatusProps> = ({ status }) => {
  return (
    <div data-testid="processing-status">
      <p>{status.message || 'Processing complete'}</p>
      <div
        data-testid="progress-bar"
        className={`h-2 rounded-full ${
          status.status === 'completed'
            ? 'bg-green-500'
            : status.status === 'failed'
            ? 'bg-red-500'
            : 'bg-blue-500'
        }`}
        style={{ width: `${status.progress}%` }}
      />
      {status.status === 'processing' && (
        <div data-testid="loading-icon" className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
      )}
    </div>
  );
};

export default ProcessingStatus;
import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

const ProcessingStatus = ({ processingId }) => {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/documents/status/${processingId}`);
        const data = await response.json();
        setStatus(data);

        // Continue polling if not completed or errored
        if (data.status !== 'completed' && data.status !== 'error') {
          setTimeout(checkStatus, 1000);
        }
      } catch (error) {
        console.error('Error checking status:', error);
      }
    };

    checkStatus();
  }, [processingId]);

  if (!status) return null;

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {status.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-500" />}
          {status.status === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
          {status.status === 'started' && <Loader2 className="w-5 h-5 animate-spin" />}
          Processing Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="text-sm text-gray-500">Progress</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
              <div 
                className={`h-2 rounded-full ${
                  status.status === 'error' ? 'bg-red-500' :
                  status.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${status.progress}%` }}
              />
            </div>
          </div>

          {status.message && (
            <div className="text-sm">
              {status.message}
            </div>
          )}

          {status.result && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="font-medium mb-2">Processed Document</div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">Title:</span> {status.result.title}
                </div>
                <div>
                  <span className="text-gray-500">Source:</span> {status.result.source_type}
                </div>
                <div>
                  <span className="text-gray-500">Word Count:</span> {status.result.metadata.word_count}
                </div>
                {status.result.metadata.language && (
                  <div>
                    <span className="text-gray-500">Language:</span> {status.result.metadata.language}
                  </div>
                )}
                {status.result.metadata.page_count && (
                  <div>
                    <span className="text-gray-500">Pages:</span> {status.result.metadata.page_count}
                  </div>
                )}
                {status.result.metadata.author && (
                  <div>
                    <span className="text-gray-500">Author:</span> {status.result.metadata.author}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProcessingStatus;

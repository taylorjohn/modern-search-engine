// src/components/git/GitChangesMonitor.tsx
import React from 'react';
import { useGitChanges } from '../../hooks/useGitChanges';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function GitMonitor() {
  const { isConnected, changes } = useGitChanges();
  
  console.log('GitMonitor rendered:', { isConnected, changes });

  const getStatusColor = (status: string) => {
    switch (status.trim()) {
      case 'M': return 'bg-yellow-500';
      case 'A': return 'bg-green-500';
      case 'D': return 'bg-red-500';
      default: return 'bg-blue-500';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Git Changes Monitor</CardTitle>
          <div className={`px-2 py-1 rounded-full text-sm ${
            isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {changes.map((change, index) => (
            <div 
              key={`${change.file}-${change.timestamp}`} 
              className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs text-white ${getStatusColor(change.status)}`}>
                  {change.status}
                </span>
                <span className="font-mono text-sm">{change.file}</span>
              </div>
              <span className="text-sm text-gray-500">
                {formatTimestamp(change.timestamp)}
              </span>
            </div>
          ))}
          {changes.length === 0 && (
            <div className="text-center text-gray-500 py-4">
              No changes detected yet
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default GitMonitor;
// src/hooks/useGitChanges.ts
import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface GitChange {
  file: string;
  status: string;
  timestamp: number;
}

interface RepositoryStatus {
  status: string;
  file: string;
  timestamp: number;
}

export function useGitChanges() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [changes, setChanges] = useState<GitChange[]>([]);
  const [repoState, setRepoState] = useState<RepositoryStatus[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newSocket = io('http://localhost:3030');

    newSocket.on('connect', () => {
      console.log('Connected to MCP server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from MCP server');
      setIsConnected(false);
    });

    newSocket.on('git-change', (change: GitChange) => {
      console.log('Received git change:', change);
      setChanges(prev => [change, ...prev].slice(0, 50));
    });

    newSocket.on('repo-state', (state: RepositoryStatus[]) => {
      console.log('Received repo state:', state);
      setRepoState(state);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return {
    isConnected,
    changes,
    repoState
  };
}
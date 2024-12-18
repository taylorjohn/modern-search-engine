import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { exec } from 'child_process';
import { watch } from 'fs';
import { Socket } from 'socket.io';
import { ExecException } from 'child_process';
import * as path from 'path';

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

class MCPServer {
  private watchPath: string;
  private changes: GitChange[];
  private io: Server;
  private server: ReturnType<typeof createServer>;

  // Extended ignore patterns
  private ignorePatterns = [
    /^\.git\//,
    /^node_modules\//,
    /^dist\//,
    /^build\//,
    /^\.DS_Store$/,
    /^npm-debug\.log$/,
    /^yarn-debug\.log$/,
    /^yarn-error\.log$/,
    /@[\d.]+$/,  // Ignore files ending with @version
    /^ts-node$/,
    /\.(lock|log)$/
  ];

  constructor(repoPath: string) {
    this.watchPath = repoPath;
    this.changes = [];

    const app = express();
    this.server = createServer(app);
    this.io = new Server(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    console.log(`MCP Server initialized - watching ${repoPath}`);
    this.setupWatcher();
    this.setupSocketHandlers();
  }

  private shouldIgnorePath(filepath: string): boolean {
    const normalizedPath = filepath.replace(/\\/g, '/');
    return this.ignorePatterns.some(pattern => pattern.test(normalizedPath));
  }

  private setupWatcher(): void {
    watch(this.watchPath, { recursive: true }, (eventType: string, filename: string | null) => {
      if (filename && !this.shouldIgnorePath(filename)) {
        // Only log file changes we care about
        if (filename.includes('.') && !filename.startsWith('.')) {
          console.log(`File change detected: ${filename} (${eventType})`);
          this.handleFileChange(filename);
        }
      }
    });
  }

  private async handleFileChange(filename: string): Promise<void> {
    const status = await this.getGitStatus(filename);
    
    // Only process if we got a meaningful git status
    if (status && status !== '??') {
      const change: GitChange = {
        file: filename,
        status,
        timestamp: Date.now()
      };
      
      console.log(`Git status: ${status} - ${filename}`);
      this.changes.push(change);
      this.io.emit('git-change', change);
    }
  }

  private getGitStatus(file: string): Promise<string> {
    return new Promise((resolve) => {
      if (this.shouldIgnorePath(file)) {
        resolve('');
        return;
      }

      exec(`git status --porcelain "${file}"`, { cwd: this.watchPath }, (error: ExecException | null, stdout: string) => {
        if (error) {
          resolve('');
          return;
        }
        const status = stdout.trim().slice(0, 2);
        resolve(status);
      });
    });
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log('Client connected to MCP server');
      
      // Send initial repository state
      this.sendRepositoryState(socket);

      socket.on('request-file', async (filepath: string) => {
        if (!this.shouldIgnorePath(filepath)) {
          const content = await this.readFile(filepath);
          socket.emit('file-content', { path: filepath, content });
        }
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected from MCP server');
      });
    });
  }

  private async sendRepositoryState(socket: Socket): Promise<void> {
    try {
      const status = await this.getRepositoryStatus();
      socket.emit('repo-state', status);
    } catch (error) {
      console.error('Error getting repository state:', error);
    }
  }

  private getRepositoryStatus(): Promise<RepositoryStatus[]> {
    return new Promise((resolve) => {
      exec('git status --porcelain', { cwd: this.watchPath }, (error: ExecException | null, stdout: string) => {
        if (error) {
          resolve([]);
          return;
        }
        const changes = stdout.trim().split('\n')
          .filter(line => line.length > 0)
          .filter(line => !this.shouldIgnorePath(line.slice(3)))
          .map(line => ({
            status: line.slice(0, 2),
            file: line.slice(3),
            timestamp: Date.now()
          }))
          .filter(change => change.status !== '??'); // Ignore untracked files
        
        if (changes.length > 0) {
          console.log('Current repository changes:', changes);
        }
        resolve(changes);
      });
    });
  }

  private readFile(filepath: string): Promise<string> {
    return new Promise((resolve) => {
      if (this.shouldIgnorePath(filepath)) {
        resolve('');
        return;
      }

      exec(`git show HEAD:"${filepath}"`, { cwd: this.watchPath }, (error: ExecException | null, stdout: string) => {
        if (error) {
          resolve('');
          return;
        }
        resolve(stdout);
      });
    });
  }

  public start(port: number): void {
    this.server.listen(port, () => {
      console.log(`MCP Server running on port ${port}`);
    });
  }
}

const mcpServer = new MCPServer(process.cwd());
mcpServer.start(3030);

export default MCPServer;
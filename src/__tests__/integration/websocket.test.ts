// src/__tests__/integration/websocket.test.ts
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { websocketService } from '../../services/websocket';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onmessage: ((event: any) => void) | null = null;
  onerror: ((error: any) => void) | null = null;
  readyState = MockWebSocket.CONNECTING;
  
  constructor(url: string) {
    // Simulate connection
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.();
    }, 50);
  }

  send(data: string) {}

  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.();
  }
}

describe('WebSocket Service', () => {
  beforeEach(() => {
    // @ts-ignore
    global.WebSocket = MockWebSocket;
    vi.useFakeTimers();
  });

  afterEach(() => {
    websocketService.disconnect();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('connects successfully', async () => {
    const connectPromise = websocketService.connect();
    await vi.advanceTimersByTimeAsync(50);
    await connectPromise;
    
    expect(websocketService.isConnected()).toBe(true);
  });

  it('handles messages correctly', async () => {
    const messageHandler = vi.fn();
    const testType = 'test-message';
    
    websocketService.subscribe(testType, messageHandler);
    const connectPromise = websocketService.connect();
    await vi.advanceTimersByTimeAsync(50);
    await connectPromise;

    // Simulate receiving a message
    const mockWs = websocketService['ws'];
    mockWs?.onmessage?.({
      data: JSON.stringify({
        type: testType,
        payload: { test: 'data' }
      })
    });

    expect(messageHandler).toHaveBeenCalledWith({ test: 'data' });
  });

  it('handles disconnection and reconnection', async () => {
    const statusHandler = vi.fn();
    websocketService.onStatusChange(statusHandler);
    
    const connectPromise = websocketService.connect();
    await vi.advanceTimersByTimeAsync(50);
    await connectPromise;
    
    expect(statusHandler).toHaveBeenLastCalledWith(true);
    
    // Simulate disconnection
    websocketService['ws']?.onclose?.();
    
    expect(statusHandler).toHaveBeenLastCalledWith(false);
    
    // Should attempt to reconnect
    await vi.advanceTimersByTimeAsync(1000);
    expect(websocketService['reconnectAttempts']).toBe(1);
  });

  it('sends messages correctly', async () => {
    const connectPromise = websocketService.connect();
    await vi.advanceTimersByTimeAsync(50);
    await connectPromise;
    
    const mockSend = vi.fn();
    if (websocketService['ws']) {
      websocketService['ws'].send = mockSend;
    }
    
    websocketService.send('test-type', { data: 'test' });
    
    expect(mockSend).toHaveBeenCalledWith(
      JSON.stringify({
        type: 'test-type',
        payload: { data: 'test' }
      })
    );
  });

  it('maintains ping/pong connection', async () => {
    const connectPromise = websocketService.connect();
    await vi.advanceTimersByTimeAsync(50);
    await connectPromise;
    
    const mockSend = vi.fn();
    if (websocketService['ws']) {
      websocketService['ws'].send = mockSend;
    }
    
    // Advance time to trigger ping
    await vi.advanceTimersByTimeAsync(30000);
    
    expect(mockSend).toHaveBeenCalledWith(
      JSON.stringify({
        type: 'ping',
        payload: {}
      })
    );
  });
});
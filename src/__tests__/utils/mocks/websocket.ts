// src/__tests__/utils/mocks/websocket.ts
export class MockWebSocket {
  private subscribers: Map<string, ((message: any) => void)[]> = new Map();
  
  subscribe(event: string, callback: (message: any) => void) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, []);
    }
    this.subscribers.get(event)?.push(callback);
    return () => this.unsubscribe(event, callback);
  }

  unsubscribe(event: string, callback: (message: any) => void) {
    const callbacks = this.subscribers.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event: string, message: any) {
    const callbacks = this.subscribers.get(event);
    callbacks?.forEach(callback => callback(message));
  }

  simulateMessage(message: any) {
    this.emit('message', message);
  }

  simulateError(error: any) {
    this.emit('error', error);
  }
}
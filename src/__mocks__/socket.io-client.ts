import { vi } from 'vitest';

const mockSocket = {
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn()
};

export const io = vi.fn(() => mockSocket);
export default io;
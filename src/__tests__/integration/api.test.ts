// src/__tests__/integration/api.test.ts
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGitChanges } from '../../hooks/useGitChanges';

describe('Git Changes API', () => {
  it('initializes with empty changes', () => {
    const { result } = renderHook(() => useGitChanges());
    expect(result.current.changes).toEqual([]);
    expect(result.current.isConnected).toBe(false);
  });
});
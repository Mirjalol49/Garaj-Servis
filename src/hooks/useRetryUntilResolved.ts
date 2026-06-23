'use client';
import { useState, useCallback } from 'react';
import { useInterval } from './useInterval';

export function useRetryUntilResolved<T>(
  callback: () => Promise<T>,
  interval: number = 1000
) {
  const [isResolved, setIsResolved] = useState(false);
  const [data, setData] = useState<T | null>(null);

  const attempt = useCallback(async () => {
    try {
      const result = await callback();
      setIsResolved(true);
      setData(result);
    } catch (error) {
      // Intentionally swallow error and keep retrying
      console.warn('Retrying async operation...');
    }
  }, [callback]);

  useInterval(
    () => {
      if (!isResolved) {
        attempt();
      }
    },
    isResolved ? null : interval
  );

  return data;
}

import { useState, useCallback } from 'react';

export function useTableState<T>(key: string, initialState: T): [T, (state: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored) as T;
      }
    } catch (error) {
      console.warn(`Failed to load table state for "${key}":`, error);
    }
    return initialState;
  });

  const updateState = useCallback((newState: T | ((prev: T) => T)) => {
    setState((prev) => {
      const resolved = typeof newState === 'function'
        ? (newState as (prev: T) => T)(prev)
        : newState;
      try {
        localStorage.setItem(key, JSON.stringify(resolved));
      } catch (error) {
        // Handle QuotaExceededError or other localStorage errors
        console.warn(`Failed to save table state for "${key}":`, error);
      }
      return resolved;
    });
  }, [key]);

  return [state, updateState];
}

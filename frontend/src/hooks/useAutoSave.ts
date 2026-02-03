import { useRef, useCallback, useState, useEffect } from 'react';
import { useDebouncedCallback } from 'use-debounce';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseAutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  delay?: number;
  enabled?: boolean;
}

export function useAutoSave<T>({
  data,
  onSave,
  delay = 2500,
  enabled = true
}: UseAutoSaveOptions<T>) {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const lastSavedRef = useRef<string>(JSON.stringify(data));
  const isSavingRef = useRef(false);

  const performSave = useCallback(async (dataToSave: T) => {
    if (isSavingRef.current) return;

    const serialized = JSON.stringify(dataToSave);
    if (serialized === lastSavedRef.current) return;

    isSavingRef.current = true;
    setStatus('saving');
    setError(null);

    try {
      await onSave(dataToSave);
      lastSavedRef.current = serialized;
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
      setStatus('error');
    } finally {
      isSavingRef.current = false;
    }
  }, [onSave]);

  const debouncedSave = useDebouncedCallback(performSave, delay);

  useEffect(() => {
    if (!enabled) return;
    debouncedSave(data);
  }, [data, enabled, debouncedSave]);

  const saveNow = useCallback(() => {
    debouncedSave.cancel();
    performSave(data);
  }, [data, performSave, debouncedSave]);

  const statusText = {
    idle: '',
    saving: 'Saving...',
    saved: 'Saved',
    error: `Error: ${error}`,
  }[status];

  return { status, statusText, error, saveNow };
}

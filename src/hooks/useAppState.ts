'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AppState } from '@/types';

const STORAGE_KEY = 'bidAnalyzer.v1';

const DEFAULT_STATE: AppState = {
  announcements: {},
  checklists: {},
  form: { projects: [], engineers: [] },
};

export function useAppState() {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState(JSON.parse(raw));
    } catch {
      // ignore corrupt data
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota errors
    }
  }, [state, loaded]);

  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState(DEFAULT_STATE);
  }, []);

  return { state, setState, reset, loaded };
}

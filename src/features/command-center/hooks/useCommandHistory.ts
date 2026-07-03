import { useCallback, useState } from 'react';

const STORAGE_KEY = 'command-center:recent';
const MAX_ITEMS = 5;

function readHistory(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string').slice(0, MAX_ITEMS) : [];
  } catch {
    return [];
  }
}

function writeHistory(items: string[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch {
    // ignore quota errors
  }
}

export function useCommandHistory() {
  const [recentQueries, setRecentQueries] = useState<string[]>(() => readHistory());

  const pushQuery = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setRecentQueries((prev) => {
      const next = [trimmed, ...prev.filter((item) => item !== trimmed)].slice(0, MAX_ITEMS);
      writeHistory(next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setRecentQueries([]);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return { recentQueries, pushQuery, clearHistory };
}

import { useCallback, useState } from 'react';

const QUERY_STORAGE_KEY = 'command-center:recent';
const DESTINATION_STORAGE_KEY = 'command-center:destinations';
const MAX_QUERIES = 5;
const MAX_DESTINATIONS = 4;

export type CommandDestination = {
  title: string;
  href: string;
};

function readQueries(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(QUERY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string').slice(0, MAX_QUERIES)
      : [];
  } catch {
    return [];
  }
}

function writeQueries(items: string[]): void {
  try {
    window.localStorage.setItem(QUERY_STORAGE_KEY, JSON.stringify(items.slice(0, MAX_QUERIES)));
  } catch {
    // ignore quota errors
  }
}

function readDestinations(): CommandDestination[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(DESTINATION_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is CommandDestination =>
          Boolean(item) &&
          typeof item === 'object' &&
          typeof (item as CommandDestination).title === 'string' &&
          typeof (item as CommandDestination).href === 'string',
      )
      .slice(0, MAX_DESTINATIONS);
  } catch {
    return [];
  }
}

function writeDestinations(items: CommandDestination[]): void {
  try {
    window.localStorage.setItem(
      DESTINATION_STORAGE_KEY,
      JSON.stringify(items.slice(0, MAX_DESTINATIONS)),
    );
  } catch {
    // ignore quota errors
  }
}

export function useCommandHistory() {
  const [recentQueries, setRecentQueries] = useState<string[]>(() => readQueries());
  const [recentDestinations, setRecentDestinations] = useState<CommandDestination[]>(() =>
    readDestinations(),
  );

  const pushQuery = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setRecentQueries((prev) => {
      const next = [trimmed, ...prev.filter((item) => item !== trimmed)].slice(0, MAX_QUERIES);
      writeQueries(next);
      return next;
    });
  }, []);

  const pushDestination = useCallback((destination: CommandDestination) => {
    const title = destination.title.trim();
    const href = destination.href.trim();
    if (!title || !href) return;
    setRecentDestinations((prev) => {
      const next = [
        { title, href },
        ...prev.filter((item) => item.href !== href),
      ].slice(0, MAX_DESTINATIONS);
      writeDestinations(next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setRecentQueries([]);
    setRecentDestinations([]);
    try {
      window.localStorage.removeItem(QUERY_STORAGE_KEY);
      window.localStorage.removeItem(DESTINATION_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return {
    recentQueries,
    recentDestinations,
    pushQuery,
    pushDestination,
    clearHistory,
  };
}

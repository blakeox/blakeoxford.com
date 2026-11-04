import { useCallback, useEffect, useRef, useState } from 'react';
import { runSearch } from '@/lib/search/searchService';
import { groupCommandItems } from '@/features/command-center/lib/groupResults';
import { mapSearchResults } from '@/features/command-center/lib/toCommandItem';
import { enrichCommandItems } from '@/features/command-center/lib/rankResults';
import { commandCenterEvents } from '@/features/command-center/lib/analytics';
import type { CommandGroup } from '@/features/command-center/types';

const DEBOUNCE_MS = 220;
function sourceFromResult(
  source: Awaited<ReturnType<typeof runSearch>>['source']
): 'ai-search' | 'vectorize' | 'local' {
  return source === 'cloudflare-ai-search'
    ? 'ai-search'
    : source === 'cloudflare-vectorize'
      ? 'vectorize'
      : 'local';
}

export function useCommandQuery(isOpen: boolean) {
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim();
  const [groups, setGroups] = useState<CommandGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchSource, setSearchSource] = useState('browse');
  const generationRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const executeSearch = useCallback(async (searchQuery: string, generation: number) => {
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const result = await runSearch({
        query: searchQuery,
        category: 'all',
        limit: 8,
        signal: controller.signal,
        onLocalResults: (records) => {
          if (generation !== generationRef.current || !records.length) return;
          setGroups(
            groupCommandItems(
              enrichCommandItems(mapSearchResults(records, 'local'), searchQuery),
              'all'
            )
          );
        },
      });
      if (generation !== generationRef.current) return;
      const source = sourceFromResult(result.source);
      const items = mapSearchResults(result.records, source);
      setGroups(groupCommandItems(enrichCommandItems(items, searchQuery), 'all'));
      setSearchSource(result.source);
      setError(
        result.meta?.degraded
          ? result.records.length
            ? 'Showing keyword matches. Broader search is temporarily unavailable.'
            : 'Broader search is temporarily unavailable. Try a different keyword.'
          : null
      );
      commandCenterEvents.searchResults({
        query_length: searchQuery.trim().length,
        result_count: items.length,
        backend: source,
        semantic_hit_count: result.meta?.semanticCount,
        top_score:
          result.meta?.topScore !== undefined
            ? Math.round(result.meta.topScore * 100) / 100
            : undefined,
      });
    } catch (err) {
      if (generation !== generationRef.current || controller.signal.aborted) return;
      console.warn('[command-center] search failed', err);
      setError('Search is temporarily unavailable.');
      setGroups([]);
    } finally {
      if (generation === generationRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const generation = ++generationRef.current;
    abortRef.current?.abort();
    setGroups([]);
    setError(null);
    const trimmed = normalizedQuery;
    setIsLoading(isOpen && !!trimmed);
    if (!isOpen) {
      setQuery('');
      setSearchSource('browse');
      return;
    }
    if (!trimmed) {
      setSearchSource('browse');
      return;
    }
    const timer = setTimeout(() => {
      void executeSearch(trimmed, generation);
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [isOpen, normalizedQuery, executeSearch]);

  return { query, setQuery, groups, isLoading, error, searchSource };
}

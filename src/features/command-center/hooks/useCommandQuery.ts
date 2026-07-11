import { useCallback, useEffect, useRef, useState } from 'react';

import { runSearch } from '../../../lib/search/searchService';
import type { SearchCategory } from '../../../lib/search/types';
import { buildBrowseGroups, groupCommandItems } from '../lib/groupResults';
import { mapSearchResults } from '../lib/toCommandItem';
import { enrichCommandItems } from '../lib/rankResults';
import { commandCenterEvents } from '../lib/analytics';
import type { CommandGroup } from '../types';

const DEBOUNCE_MS = 150;
const LOADING_DELAY_MS = 150;

function sourceFromResult(source: Awaited<ReturnType<typeof runSearch>>['source']): 'vectorize' | 'local' | 'curated' {
  if (source === 'cloudflare-vectorize') return 'vectorize';
  if (source === 'browse') return 'curated';
  return 'local';
}

function buildDefaultBrowse(): CommandGroup[] {
  return buildBrowseGroups([], [], []);
}

export function useCommandQuery(isOpen: boolean) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<SearchCategory>('all');
  const [groups, setGroups] = useState<CommandGroup[]>(buildDefaultBrowse);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchSource, setSearchSource] = useState<string>('browse');

  const generationRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadingDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const executeSearch = useCallback(async (searchQuery: string, searchCategory: SearchCategory) => {
    const generation = ++generationRef.current;
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    if (loadingDelayRef.current) clearTimeout(loadingDelayRef.current);
    loadingDelayRef.current = setTimeout(() => {
      if (generation === generationRef.current) setIsLoading(true);
    }, LOADING_DELAY_MS);

    setError(null);

    try {
      const result = await runSearch({
        query: searchQuery,
        category: searchCategory,
        limit: 12,
        signal: abortRef.current.signal,
      });

      if (generation !== generationRef.current) return;

      const itemSource = sourceFromResult(result.source);
      const items = mapSearchResults(result.records, itemSource);

      if (!searchQuery.trim() && result.source === 'browse') {
        const featured = items.filter((item) => item.kind === 'project' && item.featured).slice(0, 3);
        const recent = items.filter((item) => item.kind === 'blog').slice(0, 2);
        // Idle browse: featured + posts. CommandCenter drops posts when Recent searches exist.
        setGroups(buildBrowseGroups(featured, recent, []));
      } else {
        const enriched = enrichCommandItems(items, searchQuery);
        setGroups(groupCommandItems(enriched, searchCategory));
      }

      setSearchSource(result.source);

      if (searchQuery.trim()) {
        commandCenterEvents.searchResults({
          query_length: searchQuery.trim().length,
          result_count: items.length,
          backend: itemSource,
          semantic_hit_count: result.meta?.semanticCount,
          top_score: result.meta?.topScore !== undefined
            ? Math.round((result.meta.topScore || 0) * 100) / 100
            : undefined,
        });
      }
    } catch (err) {
      if (generation !== generationRef.current) return;
      if (err instanceof DOMException && err.name === 'AbortError') return;
      console.warn('[command-center] search failed', err);
      setError('Search is temporarily unavailable.');
      setGroups([]);
    } finally {
      if (generation === generationRef.current) {
        if (loadingDelayRef.current) clearTimeout(loadingDelayRef.current);
        setIsLoading(false);
      }
    }
  }, []);

  const scheduleSearch = useCallback(
    (searchQuery: string, searchCategory: SearchCategory) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        void executeSearch(searchQuery, searchCategory);
      }, DEBOUNCE_MS);
    },
    [executeSearch],
  );

  useEffect(() => {
    if (!isOpen) return;
    scheduleSearch(query, category);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [isOpen, query, category, scheduleSearch]);

  useEffect(() => {
    if (isOpen) return;
    setQuery('');
    setCategory('all');
    setGroups(buildDefaultBrowse());
    setError(null);
    setIsLoading(false);
    generationRef.current += 1;
    abortRef.current?.abort();
  }, [isOpen]);

  return {
    query,
    setQuery,
    category,
    setCategory,
    groups,
    isLoading,
    error,
    searchSource,
    scheduleSearch,
  };
}

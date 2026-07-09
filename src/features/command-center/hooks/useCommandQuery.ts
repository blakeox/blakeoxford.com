import { useCallback, useEffect, useRef, useState } from 'react';

import { runSearch } from '../../../lib/search/searchService';
import type { SearchCategory } from '../../../lib/search/types';
import { buildBrowseGroups, groupCommandItems } from '../lib/groupResults';
import { mapSearchResults, toCommandItem } from '../lib/toCommandItem';
import { enrichCommandItems } from '../lib/rankResults';
import { parseCommandQuery } from '../lib/parseQuery';
import { commandCenterEvents } from '../lib/analytics';
import type { CommandGroup } from '../types';
import { getNavQuickSearchPages } from '../../../config/navSearchPages';

const DEBOUNCE_MS = 150;
const LOADING_DELAY_MS = 150;

function sourceFromResult(source: Awaited<ReturnType<typeof runSearch>>['source']): 'vectorize' | 'local' | 'curated' {
  if (source === 'cloudflare-vectorize') return 'vectorize';
  if (source === 'browse') return 'curated';
  return 'local';
}

function toQuickCommandItems() {
  return getNavQuickSearchPages().map((page) =>
    toCommandItem(
      {
        type: 'page',
        title: page.title,
        description: page.description,
        href: page.href,
        tags: page.tags,
      },
      'curated',
    ),
  );
}

function buildDefaultBrowse(): CommandGroup[] {
  return buildBrowseGroups([], [], toQuickCommandItems());
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
        const recent = items.filter((item) => item.kind === 'blog').slice(0, 3);
        const quickHrefs = new Set(getNavQuickSearchPages().map((page) => page.href));
        const quick = items.filter((item) => item.kind === 'page' && quickHrefs.has(item.href));
        setGroups(buildBrowseGroups(featured, recent, quick.length ? quick : items.filter((i) => i.kind === 'page').slice(0, 3)));
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
    const searchQuery = parseCommandQuery(query).query;
    scheduleSearch(searchQuery, category);
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

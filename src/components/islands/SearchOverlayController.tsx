import { useEffect } from 'react';

import { runSearch } from '../../lib/search/searchService';
import type { SearchCategory, SearchRecord } from '../../lib/search/types';
import {
  closeMobileMenu,
  registerEscapeHandler,
  registerSearchClose,
} from '../../utils/headerController';
import { createFocusTrap } from '../../utils/focusTrap';
import { acquireScrollLock, releaseScrollLock } from '../../utils/scrollLock';

const DEBOUNCE_MS = 200;

function setSearchToggleExpanded(expanded: boolean): void {
  document.getElementById('search-toggle')?.setAttribute('aria-expanded', expanded ? 'true' : 'false');
}

function setSearchStatus(message: string): void {
  const status = document.querySelector('[data-search-status]');
  if (status) status.textContent = message;
}

export default function SearchOverlayController() {
  useEffect(() => {
    let cancelled = false;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let activeCategory: SearchCategory = 'all';
    let activeIndex = -1;
    let currentQuery = '';
    let currentResults: SearchRecord[] = [];
    let searchGeneration = 0;

    const doc = document;
    const toggleButton = doc.getElementById('search-toggle');
    const closeButton = doc.getElementById('close-search');
    const overlayElement = doc.getElementById('search-overlay');
    const overlayPanel = overlayElement?.querySelector('[data-panel]') as HTMLElement | null;
    const backdropElement = overlayElement?.querySelector('[data-overlay-backdrop]');
    const searchInput = doc.getElementById('search-input') as HTMLInputElement | null;
    const resultsWrapper = overlayElement?.querySelector('[data-results]') as HTMLElement | null;
    const resultsContainer = overlayElement?.querySelector('[data-results-container]') as HTMLElement | null;
    const emptyState = overlayElement?.querySelector('[data-search-empty]') as HTMLElement | null;
    const loadingState = overlayElement?.querySelector('[data-search-loading]') as HTMLElement | null;
    const categoryButtons = overlayElement?.querySelectorAll<HTMLButtonElement>('[data-search-category-group] [data-category]') ?? [];

    const focusTrap = createFocusTrap(overlayElement, {
      initialFocus: searchInput,
      returnFocus: toggleButton,
      fallbackFocus: overlayPanel,
    });

    const setLoading = (loading: boolean) => {
      loadingState?.classList.toggle('hidden', !loading);
      overlayElement?.setAttribute('data-search-loading', loading ? 'true' : 'false');
    };

    const escapeRegExp = (input: string): string => input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const createHighlightedFragment = (text: string, query: string): DocumentFragment => {
      const fragment = doc.createDocumentFragment();
      if (!query.trim()) {
        fragment.appendChild(doc.createTextNode(text));
        return fragment;
      }
      const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
      let lastIndex = 0;
      text.replace(regex, (match, _group, offset) => {
        if (offset > lastIndex) fragment.appendChild(doc.createTextNode(text.slice(lastIndex, offset)));
        const mark = doc.createElement('mark');
        mark.className = 'rounded bg-accent/20 px-1 py-0.5 text-foreground';
        mark.textContent = match;
        fragment.appendChild(mark);
        lastIndex = offset + match.length;
        return match;
      });
      if (lastIndex < text.length) fragment.appendChild(doc.createTextNode(text.slice(lastIndex)));
      return fragment;
    };

    const applyActiveState = () => {
      if (!resultsContainer) return;
      const nodes = Array.from(resultsContainer.querySelectorAll<HTMLElement>('[data-index]'));
      nodes.forEach((node, index) => {
        if (index === activeIndex) {
          node.classList.add('ring-2', 'ring-accent/60', 'ring-offset-2');
          node.setAttribute('aria-selected', 'true');
          searchInput?.setAttribute('aria-activedescendant', node.id);
        } else {
          node.classList.remove('ring-2', 'ring-accent/60', 'ring-offset-2');
          node.setAttribute('aria-selected', 'false');
        }
      });
    };

    const renderResults = (records: SearchRecord[], query: string) => {
      if (!resultsContainer || !resultsWrapper) return;

      resultsContainer.innerHTML = '';
      currentResults = records;

      if (!records.length) {
        resultsWrapper.classList.add('hidden');
        resultsWrapper.setAttribute('aria-hidden', 'true');
        emptyState?.classList.remove('hidden');
        emptyState?.setAttribute('aria-hidden', 'false');
        searchInput?.setAttribute('aria-expanded', 'false');
        searchInput?.removeAttribute('aria-activedescendant');
        activeIndex = -1;
        setSearchStatus(query.trim() ? `No results for "${query.trim()}".` : 'Start typing to search the site.');
        return;
      }

      emptyState?.classList.add('hidden');
      emptyState?.setAttribute('aria-hidden', 'true');
      resultsWrapper.classList.remove('hidden');
      resultsWrapper.setAttribute('aria-hidden', 'false');
      searchInput?.setAttribute('aria-expanded', 'true');

      records.forEach((record, index) => {
        const option = doc.createElement('a');
        option.id = `search-result-${index}`;
        option.setAttribute('data-index', String(index));
        option.setAttribute('role', 'option');
        option.setAttribute('aria-selected', 'false');
        option.href = record.href;
        option.tabIndex = -1;
        option.className = 'search-result focus-ring-interactive touch-target group flex min-h-11 flex-col gap-2 rounded-2xl border border-border/40 bg-surface/95 p-4 sm:p-5 transition-all duration-200 hover:border-accent/50 hover:shadow-lg';

        option.addEventListener('click', () => {
          closeOverlay();
        });

        const title = doc.createElement('span');
        title.className = 'block text-sm font-semibold tracking-tight text-foreground';
        title.appendChild(createHighlightedFragment(record.title, query));

        const description = doc.createElement('span');
        description.className = 'mt-1 block text-xs leading-relaxed text-muted-foreground';
        description.appendChild(createHighlightedFragment(record.description, query));

        const metaRow = doc.createElement('div');
        metaRow.className = 'flex items-center gap-2 text-xxs font-semibold uppercase tracking-label text-subtle-foreground';

        const typeBadge = doc.createElement('span');
        typeBadge.className = 'inline-flex items-center gap-1 rounded-full bg-surface-subtle px-2 py-1 ring-1 ring-border/30';
        typeBadge.textContent = record.type === 'project' ? 'Project' : record.type === 'blog' ? 'Blog' : 'Page';
        metaRow.appendChild(typeBadge);

        if (record.featured) {
          const featuredBadge = doc.createElement('span');
          featuredBadge.className = 'inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-1 text-accent ring-1 ring-accent/30';
          featuredBadge.textContent = 'Featured';
          metaRow.appendChild(featuredBadge);
        }

        option.appendChild(title);
        option.appendChild(description);
        option.appendChild(metaRow);
        resultsContainer.appendChild(option);
      });

      activeIndex = records.length ? 0 : -1;
      applyActiveState();
      setSearchStatus(`${records.length} result${records.length === 1 ? '' : 's'}${query.trim() ? ` for "${query.trim()}"` : ''}.`);
      focusTrap.update();
    };

    const updateCategoryButtons = (category: SearchCategory) => {
      categoryButtons.forEach((button) => {
        const isActive = button.dataset.category === category;
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        if (isActive) {
          button.dataset.active = '';
          button.classList.add('bg-accent/15', 'text-accent', 'ring-1', 'ring-accent/40');
        } else {
          delete button.dataset.active;
          button.classList.remove('bg-accent/15', 'text-accent', 'ring-1', 'ring-accent/40');
        }
      });
    };

    const executeSearch = async () => {
      const generation = ++searchGeneration;
      setLoading(true);

      try {
        const result = await runSearch({
          query: currentQuery,
          category: activeCategory,
          limit: 10,
        });

        if (cancelled || generation !== searchGeneration) return;
        renderResults(result.records, currentQuery);

        if (result.source === 'cloudflare-vectorize' && currentQuery.trim()) {
          overlayElement?.setAttribute('data-search-source', 'cloudflare-vectorize');
        } else {
          overlayElement?.setAttribute('data-search-source', result.source);
        }
      } catch (error) {
        console.warn('[search] Query failed', error);
        if (!cancelled && generation === searchGeneration) {
          renderResults([], currentQuery);
          setSearchStatus('Search is temporarily unavailable. Try again in a moment.');
        }
      } finally {
        if (!cancelled && generation === searchGeneration) setLoading(false);
      }
    };

    const scheduleSearch = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        void executeSearch();
      }, DEBOUNCE_MS);
    };

    const openOverlay = () => {
      if (cancelled || overlayElement?.dataset.state === 'open') return;
      closeMobileMenu();
      if (!overlayElement) return;

      overlayElement.removeAttribute('data-authoritative-closed');
      if (overlayElement.hasAttribute('data-closed-lock')) return;

      overlayElement.dataset.state = 'open';
      overlayElement.classList.add('active');
      overlayElement.removeAttribute('aria-hidden');
      overlayElement.removeAttribute('inert');
      overlayElement.style.setProperty('display', 'block', 'important');
      overlayElement.style.setProperty('visibility', 'visible', 'important');
      overlayElement.style.setProperty('opacity', '1', 'important');

      acquireScrollLock();
      setSearchToggleExpanded(true);
      focusTrap.activate();
      setTimeout(() => searchInput?.focus(), 50);
      void executeSearch();
    };

    const closeOverlay = () => {
      if (!overlayElement || overlayElement.dataset.state === 'closed') return;

      overlayElement.dataset.state = 'closed';
      overlayElement.classList.remove('active');
      overlayElement.setAttribute('inert', '');
      overlayElement.setAttribute('aria-hidden', 'true');
      overlayElement.style.opacity = '0';
      overlayElement.style.visibility = 'hidden';
      overlayElement.style.display = 'none';

      releaseScrollLock();
      setSearchToggleExpanded(false);
      focusTrap.deactivate();
      searchInput?.setAttribute('aria-expanded', 'false');
      setLoading(false);
    };

    const handleToggleClick = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      openOverlay();
    };

    const handleCloseClick = (event: Event) => {
      event.preventDefault();
      closeOverlay();
    };

    const handleSlashShortcut = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.defaultPrevented) return;
      const activeElement = doc.activeElement as HTMLElement | null;
      if (activeElement && ['INPUT', 'TEXTAREA'].includes(activeElement.tagName)) return;
      event.preventDefault();
      openOverlay();
    };

    const handleMetaKShortcut = (event: KeyboardEvent) => {
      const metaKey = event.metaKey || event.ctrlKey;
      if (!metaKey || event.key.toLowerCase() !== 'k') return;
      event.preventDefault();
      openOverlay();
    };

    const handleInput = (event: Event) => {
      currentQuery = (event.target as HTMLInputElement).value;
      scheduleSearch();
    };

    const moveActiveIndex = (delta: number) => {
      if (!currentResults.length) return;
      activeIndex = (activeIndex + delta + currentResults.length) % currentResults.length;
      applyActiveState();
    };

    const handleInputKeydown = (event: KeyboardEvent) => {
      if (!currentResults.length) return;
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        moveActiveIndex(1);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        moveActiveIndex(-1);
      } else if (event.key === 'Enter' && activeIndex >= 0 && currentResults[activeIndex]) {
        closeOverlay();
        window.location.href = currentResults[activeIndex].href;
      }
    };

    const handleCategoryClick = (event: Event) => {
      const button = event.currentTarget as HTMLButtonElement;
      activeCategory = (button.dataset.category as SearchCategory) ?? 'all';
      updateCategoryButtons(activeCategory);
      scheduleSearch();
    };

    const handleResultMouseEnter = (event: MouseEvent) => {
      const target = (event.target as HTMLElement).closest('[data-index]') as HTMLElement | null;
      if (!target) return;
      const index = Number(target.dataset.index ?? -1);
      if (Number.isFinite(index)) {
        activeIndex = index;
        applyActiveState();
      }
    };

    const handleBackdrop = (event: MouseEvent) => {
      if (!overlayElement || event.target !== backdropElement) return;
      closeOverlay();
    };

    updateCategoryButtons(activeCategory);

    const overlayApi = { openSearchOverlay: openOverlay, closeSearchOverlay: closeOverlay };
    const win = window as typeof window & {
      enhancedSearchOverlay?: typeof overlayApi;
      searchOverlay?: typeof overlayApi;
    };
    win.enhancedSearchOverlay = overlayApi;
    win.searchOverlay = overlayApi;
    overlayElement?.setAttribute('data-ready', 'true');

    toggleButton?.addEventListener('click', handleToggleClick, { passive: false });
    closeButton?.addEventListener('click', handleCloseClick, { passive: false });
    backdropElement?.addEventListener('click', handleBackdrop as EventListener, { passive: true });
    doc.addEventListener('keydown', handleSlashShortcut, { passive: false });
    doc.addEventListener('keydown', handleMetaKShortcut, { passive: false });
    searchInput?.addEventListener('input', handleInput, { passive: true });
    searchInput?.addEventListener('keydown', handleInputKeydown, { passive: false });
    categoryButtons.forEach((button) => button.addEventListener('click', handleCategoryClick, { passive: true }));
    resultsContainer?.addEventListener('mouseenter', handleResultMouseEnter, { passive: true });
    resultsContainer?.addEventListener('mousemove', handleResultMouseEnter, { passive: true });

    const cleanupEscape = registerEscapeHandler({
      id: 'search-overlay',
      priority: 2,
      isActive: () => overlayElement?.dataset.state === 'open',
      handle: () => closeOverlay(),
    });
    const cleanupSearchClose = registerSearchClose(closeOverlay);

    return () => {
      cancelled = true;
      if (debounceTimer) clearTimeout(debounceTimer);
      cleanupEscape();
      cleanupSearchClose();
      toggleButton?.removeEventListener('click', handleToggleClick);
      closeButton?.removeEventListener('click', handleCloseClick);
      backdropElement?.removeEventListener('click', handleBackdrop as EventListener);
      doc.removeEventListener('keydown', handleSlashShortcut);
      doc.removeEventListener('keydown', handleMetaKShortcut);
      searchInput?.removeEventListener('input', handleInput);
      searchInput?.removeEventListener('keydown', handleInputKeydown);
      categoryButtons.forEach((button) => button.removeEventListener('click', handleCategoryClick));
      resultsContainer?.removeEventListener('mouseenter', handleResultMouseEnter);
      resultsContainer?.removeEventListener('mousemove', handleResultMouseEnter);
      if (win.enhancedSearchOverlay === overlayApi) delete win.enhancedSearchOverlay;
      if (win.searchOverlay === overlayApi) delete win.searchOverlay;
    };
  }, []);

  return null;
}

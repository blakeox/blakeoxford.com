import { useEffect } from 'react';

import { getNavSearchPages, type NavSearchPage } from '../../config/navSearchPages';
import {
  closeMobileMenu,
  registerEscapeHandler,
  registerSearchClose,
} from '../../utils/headerController';
import { createFocusTrap } from '../../utils/focusTrap';
import { acquireScrollLock, releaseScrollLock } from '../../utils/scrollLock';

type SearchCategory = 'all' | 'projects' | 'pages';

type SearchRecord = NavSearchPage | {
  type: 'project';
  title: string;
  description: string;
  href: string;
  tags: string[];
  featured?: boolean;
};

interface ProjectAPIItem {
  slug: string;
  title: string;
  description?: string;
  tags?: string[];
  featured?: boolean;
}

function setSearchToggleExpanded(expanded: boolean): void {
  const toggle = document.getElementById('search-toggle');
  toggle?.setAttribute('aria-expanded', expanded ? 'true' : 'false');
}

export default function SearchOverlayController() {
  useEffect(() => {
    let cancelled = false;
    let projectsLoaded = false;
    let projectsLoading = false;
    let projectRecords: SearchRecord[] = [];
    let currentResults: SearchRecord[] = [];
    let activeCategory: SearchCategory = 'all';
    let activeIndex = -1;
    let currentQuery = '';

    const win = window as typeof window & {
      enhancedSearchOverlay?: { openSearchOverlay: () => void; closeSearchOverlay: () => void };
      searchOverlay?: { openSearchOverlay: () => void; closeSearchOverlay: () => void };
    };

    const doc = document;
    const staticPages = getNavSearchPages();

    const toggleButton = doc.getElementById('search-toggle');
    const closeButton = doc.getElementById('close-search');
    const overlayElement = doc.getElementById('search-overlay');
    const overlayPanel = overlayElement?.querySelector('[data-panel]') as HTMLElement | null;
    const backdropElement = overlayElement?.querySelector('[data-overlay-backdrop]');
    const searchInput = doc.getElementById('search-input') as HTMLInputElement | null;
    const resultsWrapper = overlayElement?.querySelector('[data-results]') as HTMLElement | null;
    const resultsContainer = overlayElement?.querySelector('[data-results-container]') as HTMLElement | null;
    const categoryButtons = overlayElement?.querySelectorAll<HTMLButtonElement>('[data-search-category-group] [data-category]') ?? [];

    const focusTrap = createFocusTrap(overlayElement, {
      initialFocus: searchInput,
      returnFocus: toggleButton,
      fallbackFocus: overlayPanel,
    });

    const openOverlay = () => {
      if (cancelled || overlayElement?.dataset.state === 'open') return;

      closeMobileMenu();

      if (!overlayElement) return;

      try {
        if (overlayElement.hasAttribute('data-authoritative-closed')) {
          overlayElement.removeAttribute('data-authoritative-closed');
        }
        if (overlayElement.hasAttribute('data-closed-lock')) return;
      } catch { /* noop */ }

      overlayElement.dataset.state = 'open';
      overlayElement.classList.add('active');
      overlayElement.removeAttribute('aria-hidden');
      overlayElement.removeAttribute('inert');

      try {
        overlayElement.style.setProperty('display', 'block', 'important');
        overlayElement.style.setProperty('visibility', 'visible', 'important');
        overlayElement.style.setProperty('opacity', '1', 'important');
      } catch {
        overlayElement.style.display = 'block';
        overlayElement.style.visibility = 'visible';
        overlayElement.style.opacity = '1';
      }

      acquireScrollLock();
      setSearchToggleExpanded(true);
      focusTrap.activate();

      if (searchInput) {
        setTimeout(() => searchInput.focus(), 50);
        searchInput.setAttribute('aria-expanded', 'true');
      }

      if (!projectsLoaded && !projectsLoading) {
        loadProjects();
      }
    };

    const closeOverlay = () => {
      if (!overlayElement || overlayElement.dataset.state === 'closed') return;

      try {
        if (typeof (window as Window & { ensureOverlayClosed?: () => void }).ensureOverlayClosed === 'function') {
          (window as Window & { ensureOverlayClosed?: () => void }).ensureOverlayClosed?.();
          return;
        }
      } catch { /* noop */ }

      overlayElement.dataset.state = 'closed';
      overlayElement.classList.remove('active');
      overlayElement.setAttribute('inert', '');
      overlayElement.setAttribute('aria-hidden', 'true');
      overlayElement.style.opacity = '0';
      overlayElement.style.visibility = 'hidden';
      overlayElement.style.display = 'none';

      delete doc.body.dataset.searchOpen;
      releaseScrollLock();
      setSearchToggleExpanded(false);
      focusTrap.deactivate();
      searchInput?.setAttribute('aria-expanded', 'false');
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
        if (offset > lastIndex) {
          fragment.appendChild(doc.createTextNode(text.slice(lastIndex, offset)));
        }
        const mark = doc.createElement('mark');
        mark.className = 'rounded bg-accent/20 px-1 py-0.5 text-foreground';
        mark.textContent = match;
        fragment.appendChild(mark);
        lastIndex = offset + match.length;
        return match;
      });
      if (lastIndex < text.length) {
        fragment.appendChild(doc.createTextNode(text.slice(lastIndex)));
      }
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

    const renderResults = (records: SearchRecord[]) => {
      if (!resultsContainer || !resultsWrapper) return;
      resultsContainer.innerHTML = '';

      if (!records.length) {
        resultsWrapper.classList.add('hidden');
        resultsWrapper.setAttribute('aria-hidden', 'true');
        searchInput?.setAttribute('aria-activedescendant', '');
        activeIndex = -1;
        currentResults = records;
        return;
      }

      resultsWrapper.classList.remove('hidden');
      resultsWrapper.setAttribute('aria-hidden', 'false');

      records.forEach((record, index) => {
        const option = doc.createElement('a');
        option.id = `search-result-${index}`;
        option.setAttribute('data-index', String(index));
        option.setAttribute('role', 'option');
        option.setAttribute('aria-selected', 'false');
        option.href = record.href;
        option.tabIndex = -1;
        option.className = 'search-result focus-ring-interactive touch-target group flex min-h-11 flex-col gap-2 rounded-2xl border border-border/40 bg-surface/95 p-4 sm:p-5 transition-all duration-200 hover:border-accent/50 hover:shadow-lg';

        const title = doc.createElement('span');
        title.className = 'block text-sm font-semibold tracking-tight text-foreground';
        title.appendChild(createHighlightedFragment(record.title, currentQuery));

        const description = doc.createElement('span');
        description.className = 'mt-1 block text-xs leading-relaxed text-muted-foreground';
        description.appendChild(createHighlightedFragment(record.description, currentQuery));

        const metaRow = doc.createElement('div');
        metaRow.className = 'flex items-center gap-2 text-xxs font-semibold uppercase tracking-label text-subtle-foreground';

        const typeBadge = doc.createElement('span');
        typeBadge.className = 'inline-flex items-center gap-1 rounded-full bg-surface-subtle px-2 py-1 ring-1 ring-border/30';
        typeBadge.textContent = record.type === 'project' ? 'Project' : 'Page';
        metaRow.appendChild(typeBadge);

        if ('featured' in record && record.featured) {
          const featuredBadge = doc.createElement('span');
          featuredBadge.className = 'inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-1 text-accent ring-1 ring-accent/30';
          featuredBadge.textContent = 'Featured';
          metaRow.appendChild(featuredBadge);
        }

        if (record.tags.length) {
          const tags = doc.createElement('div');
          tags.className = 'flex flex-wrap gap-1 text-xxs uppercase tracking-label text-subtle-foreground/90';
          record.tags.slice(0, 4).forEach((tag) => {
            const pill = doc.createElement('span');
            pill.className = 'rounded-full bg-surface px-2 py-0.5 ring-1 ring-border/25';
            pill.textContent = tag;
            tags.appendChild(pill);
          });
          metaRow.appendChild(tags);
        }

        option.appendChild(title);
        option.appendChild(description);
        option.appendChild(metaRow);
        resultsContainer.appendChild(option);
      });

      currentResults = records;
      activeIndex = records.length ? 0 : -1;
      applyActiveState();
    };

    const filterRecords = (query: string, category: SearchCategory): SearchRecord[] => {
      const normalized = query.trim().toLowerCase();
      const pool = category === 'projects'
        ? projectRecords
        : category === 'pages'
          ? staticPages
          : [...projectRecords, ...staticPages];

      if (!normalized) {
        return pool
          .slice()
          .sort((a, b) => Number(Boolean('featured' in b && b.featured)) - Number(Boolean('featured' in a && a.featured)))
          .slice(0, 8);
      }

      const terms = normalized.split(/\s+/).filter(Boolean);
      return pool
        .filter((record) => {
          const haystack = `${record.title} ${record.description} ${record.tags.join(' ')}`.toLowerCase();
          return terms.every((term) => haystack.includes(term));
        })
        .slice(0, 10);
    };

    const updateCategoryButtons = (category: SearchCategory) => {
      categoryButtons.forEach((button) => {
        if (button.dataset.category === category) {
          button.dataset.active = '';
          button.classList.add('bg-accent/15', 'text-accent', 'ring-1', 'ring-accent/40');
        } else {
          delete button.dataset.active;
          button.classList.remove('bg-accent/15', 'text-accent', 'ring-1', 'ring-accent/40');
        }
      });
    };

    const runSearch = () => {
      const records = filterRecords(currentQuery, activeCategory);
      renderResults(records);
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
      runSearch();
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
        window.location.href = currentResults[activeIndex].href;
      }
    };

    const handleCategoryClick = (event: Event) => {
      const button = event.currentTarget as HTMLButtonElement;
      activeCategory = (button.dataset.category as SearchCategory) ?? 'all';
      updateCategoryButtons(activeCategory);
      runSearch();
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

    const handleResultFocus = (event: FocusEvent) => {
      const target = (event.target as HTMLElement).closest('[data-index]') as HTMLElement | null;
      if (!target) return;
      const index = Number(target.dataset.index ?? -1);
      if (Number.isFinite(index)) {
        activeIndex = index;
        applyActiveState();
      }
    };

    const abortController = new AbortController();

    const loadProjects = async () => {
      projectsLoading = true;
      try {
        const response = await fetch('/api/projects.json', { signal: abortController.signal });
        if (!response.ok) throw new Error(`Failed to load projects (${response.status})`);
        const json = await response.json();
        projectRecords = Array.isArray(json)
          ? json.map((item: ProjectAPIItem) => ({
              type: 'project' as const,
              title: item.title ?? 'Untitled project',
              description: item.description ?? '',
              href: `/projects/${item.slug}/`,
              tags: Array.isArray(item.tags) ? item.tags : [],
              featured: Boolean(item.featured),
            }))
          : [];
        projectsLoaded = true;
      } catch (error) {
        console.warn('Search overlay failed to load projects index', error);
        projectRecords = [];
      } finally {
        projectsLoading = false;
        runSearch();
      }
    };

    const handleBackdrop = (event: MouseEvent) => {
      if (!overlayElement || event.target !== backdropElement) return;
      closeOverlay();
    };

    updateCategoryButtons(activeCategory);
    runSearch();

    const overlayApi = { openSearchOverlay: openOverlay, closeSearchOverlay: closeOverlay };
    win.enhancedSearchOverlay = overlayApi;
    win.searchOverlay = overlayApi;

    toggleButton?.addEventListener('click', handleToggleClick, { passive: false });
    closeButton?.addEventListener('click', handleCloseClick, { passive: false });
    backdropElement?.addEventListener('click', handleBackdrop as EventListener, { passive: true });

    doc.addEventListener('keydown', handleSlashShortcut, { passive: false });
    doc.addEventListener('keydown', handleMetaKShortcut, { passive: false });

    searchInput?.addEventListener('input', handleInput, { passive: true });
    searchInput?.addEventListener('keydown', handleInputKeydown, { passive: false });

    categoryButtons.forEach((button) => {
      button.addEventListener('click', handleCategoryClick, { passive: true });
    });

    resultsContainer?.addEventListener('mouseenter', handleResultMouseEnter, { passive: true });
    resultsContainer?.addEventListener('mousemove', handleResultMouseEnter, { passive: true });
    resultsContainer?.addEventListener('focusin', handleResultFocus, { passive: true });

    const cleanupEscape = registerEscapeHandler({
      id: 'search-overlay',
      priority: 2,
      isActive: () => overlayElement?.dataset.state === 'open',
      handle: () => closeOverlay(),
    });

    const cleanupSearchClose = registerSearchClose(closeOverlay);

    return () => {
      cancelled = true;
      abortController.abort();
      cleanupEscape();
      cleanupSearchClose();
      toggleButton?.removeEventListener('click', handleToggleClick);
      closeButton?.removeEventListener('click', handleCloseClick);
      backdropElement?.removeEventListener('click', handleBackdrop as EventListener);
      doc.removeEventListener('keydown', handleSlashShortcut);
      doc.removeEventListener('keydown', handleMetaKShortcut);
      searchInput?.removeEventListener('input', handleInput);
      searchInput?.removeEventListener('keydown', handleInputKeydown);
      categoryButtons.forEach((button) => {
        button.removeEventListener('click', handleCategoryClick);
      });
      resultsContainer?.removeEventListener('mouseenter', handleResultMouseEnter);
      resultsContainer?.removeEventListener('mousemove', handleResultMouseEnter);
      resultsContainer?.removeEventListener('focusin', handleResultFocus);
      if (win.enhancedSearchOverlay === overlayApi) delete win.enhancedSearchOverlay;
      if (win.searchOverlay === overlayApi) delete win.searchOverlay;
    };
  }, []);

  return null;
}

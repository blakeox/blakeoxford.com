import { useEffect } from 'react';

type OverlayState = 'idle' | 'fallback';

type SearchCategory = 'all' | 'projects' | 'pages';

type SearchRecord = {
  type: 'project' | 'page';
  title: string;
  description: string;
  href: string;
  tags: string[];
  featured?: boolean;
};

// API response type for project data
interface ProjectAPIItem {
  slug: string;
  title: string;
  description?: string;
  tags?: string[];
  featured?: boolean;
}

function openFallbackOverlay(): void {
  const overlay = document.getElementById('search-overlay');
  if (!overlay) return;
  try {
    // If authoritative closed exists from SSR or test harness, remove it on user-initiated open.
    if (overlay.hasAttribute && overlay.hasAttribute('data-authoritative-closed')) {
      try { overlay.removeAttribute('data-authoritative-closed'); } catch (e) { /* noop */ }
    }
    // Respect transient closed-lock used by tests to prevent reopens.
    if (overlay.hasAttribute && overlay.hasAttribute('data-closed-lock')) return;
  } catch { /* noop */ }

  overlay.dataset.state = 'open';
  try { overlay.dataset.openTs = String(Date.now()); } catch { /* noop */ }
  // Ensure overlay is visible and interactive immediately for deterministic tests
  overlay.classList.add('active');

  // Remove aria-hidden entirely (presence matters)
  try { overlay.removeAttribute('aria-hidden'); } catch { /* noop */ }

  // Override any important hide rules set by ensureOverlayClosed
  try {
    overlay.style.setProperty('display', 'block', 'important');
    overlay.style.setProperty('visibility', 'visible', 'important');
    overlay.style.setProperty('opacity', '1', 'important');
  } catch (e) {
    overlay.style.display = 'block';
    overlay.style.visibility = 'visible';
    overlay.style.opacity = '1';
  }

  try { overlay.removeAttribute('inert'); } catch { /* noop */ }

  document.body.dataset.searchOpen = 'true';
  document.body.style.overflow = 'hidden';
  document.body.style.position = 'fixed';
  document.body.style.width = '100%';

  const input = document.getElementById('search-input') as HTMLInputElement | null;
  if (input) {
    setTimeout(() => input.focus(), 50);
    input.setAttribute('aria-expanded', 'true');
  }
}

function closeFallbackOverlay(): void {
  const overlay = document.getElementById('search-overlay');
  if (!overlay) return;

  // Immediately update state and remove interactivity so tests observe closed state
  overlay.dataset.state = 'closed';
  overlay.classList.remove('active');
  overlay.setAttribute('inert', '');
  overlay.setAttribute('aria-hidden', 'true');

  // Hide inline so Playwright/test runners see it as not visible right away
  overlay.style.opacity = '0';
  overlay.style.visibility = 'hidden';
  overlay.style.display = 'none';

  delete document.body.dataset.searchOpen;
  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.width = '';

  const input = document.getElementById('search-input');
  input?.setAttribute('aria-expanded', 'false');
}

export default function SearchOverlayController() {
  useEffect(() => {
    let cancelled = false;
    let state: OverlayState = 'idle';

    const win = window as typeof window & {
      enhancedSearchOverlay?: {
        openSearchOverlay: () => void;
        closeSearchOverlay: () => void;
      };
      searchOverlay?: {
        openSearchOverlay: () => void;
        closeSearchOverlay: () => void;
      };
    };

    const doc = document;

    const openOverlay = () => {
      if (cancelled || overlayElement?.dataset.state === 'open') return;
      state = 'fallback';
      openFallbackOverlay();
      // analytics removed; no-op
    };

    const closeOverlay = () => {
      try {
        if (overlayElement?.dataset.state === 'closed') return;
        // Attempt authoritative close synchronously
        if (typeof (window as any).ensureOverlayClosed === 'function') {
          try { (window as any).ensureOverlayClosed(); return; } catch { /* noop */ }
        }
        closeFallbackOverlay();
      } catch(e) { console.error('closeOverlay failed', e); }
      // analytics removed; no-op
    };

    const toggleButton = doc.getElementById('search-toggle');
    const closeButton = doc.getElementById('close-search');
    const overlayElement = doc.getElementById('search-overlay');
    const backdropElement = overlayElement?.querySelector('[data-overlay-backdrop]');
    const searchInput = doc.getElementById('search-input') as HTMLInputElement | null;
    const resultsWrapper = overlayElement?.querySelector('[data-results]') as HTMLElement | null;
    const resultsContainer = overlayElement?.querySelector('[data-results-container]') as HTMLElement | null;
    const categoryButtons = overlayElement?.querySelectorAll<HTMLButtonElement>('[data-search-category-group] [data-category]') ?? [];

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
      if (activeElement && ['INPUT', 'TEXTAREA'].includes(activeElement.tagName)) {
        return;
      }
      event.preventDefault();
      openOverlay();
    };

    const handleMetaKShortcut = (event: KeyboardEvent) => {
      const metaKey = event.metaKey || event.ctrlKey;
      if (!metaKey || event.key.toLowerCase() !== 'k') return;
      event.preventDefault();
      openOverlay();
    };

    const handleEscape = (event: KeyboardEvent) => {
      try { console.debug('handleEscape invoked', { key: event.key, state: overlayElement?.dataset.state }); } catch { /* noop */ }

      if (event.key !== 'Escape') return;
      if (overlayElement?.dataset.state !== 'open' && state !== 'fallback') return;
      event.preventDefault();
      closeOverlay();
    };

    const handleBackdrop = (event: MouseEvent) => {
      if (!overlayElement || event.target !== backdropElement) return;
      closeOverlay();
    };

    const handleFocusTrap = (event: FocusEvent) => {
      if (overlayElement?.dataset.state !== 'open') return;
      if (!overlayElement.contains(event.target as Node)) {
        event.stopPropagation();
        searchInput?.focus();
      }
    };

    const staticPages: SearchRecord[] = [
      {
        type: 'page',
        title: 'Home',
        description: 'Portfolio overview and signature programs.',
        href: '/',
        tags: ['home', 'overview']
      },
      {
        type: 'page',
        title: 'About',
        description: 'Credentials, achievements, and professional journey.',
        href: '/about/',
        tags: ['about', 'biography', 'achievements']
      },
      {
        type: 'page',
        title: 'Projects',
        description: 'Selected case studies across automation, analytics, and change enablement.',
        href: '/projects/',
        tags: ['projects', 'case studies']
      },
      {
        type: 'page',
        title: 'Contact',
        description: 'Start a working session or send a note.',
        href: '/contact/',
        tags: ['contact', 'connect']
      }
    ];

    let projectRecords: SearchRecord[] = [];
    let currentResults: SearchRecord[] = [];
    let activeCategory: SearchCategory = 'all';
    let activeIndex = -1;
    let currentQuery = '';

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
  option.className = 'search-result group flex flex-col gap-2 rounded-2xl border border-border/40 bg-background/95 p-4 sm:p-5 transition-all duration-200 hover:border-accent/50 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 dark:bg-surface-dark/95';

        const title = doc.createElement('span');
        title.className = 'block text-sm font-semibold tracking-tight text-foreground dark:text-foreground-light';
        title.appendChild(createHighlightedFragment(record.title, currentQuery));

        const description = doc.createElement('span');
        description.className = 'mt-1 block text-xs leading-relaxed text-foreground/70 dark:text-foreground-light/70';
        description.appendChild(createHighlightedFragment(record.description, currentQuery));

        const metaRow = doc.createElement('div');
        metaRow.className = 'flex items-center gap-2 text-xxs font-semibold uppercase tracking-label text-foreground/60 dark:text-foreground-light/60';

        const typeBadge = doc.createElement('span');
        typeBadge.className = 'inline-flex items-center gap-1 rounded-full bg-surface-subtle px-2 py-1 ring-1 ring-border/30 dark:bg-surface-dark-subtle';
        typeBadge.textContent = record.type === 'project' ? 'Project' : 'Page';
        metaRow.appendChild(typeBadge);

        if (record.featured) {
          const featuredBadge = doc.createElement('span');
          featuredBadge.className = 'inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-1 text-accent ring-1 ring-accent/30';
          featuredBadge.textContent = 'Featured';
          metaRow.appendChild(featuredBadge);
        }

        if (record.tags.length) {
          const tags = doc.createElement('div');
          tags.className = 'flex flex-wrap gap-1 text-xxs uppercase tracking-label text-foreground/50 dark:text-foreground-light/50';
          record.tags.slice(0, 4).forEach(tag => {
            const pill = doc.createElement('span');
            pill.className = 'rounded-full bg-surface px-2 py-0.5 ring-1 ring-border/25 dark:bg-surface-dark';
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
          .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)))
          .slice(0, 8);
      }

      const terms = normalized.split(/\s+/).filter(Boolean);
      return pool
        .filter(record => {
          const haystack = `${record.title} ${record.description} ${record.tags.join(' ')}`.toLowerCase();
          return terms.every(term => haystack.includes(term));
        })
        .slice(0, 10);
    };

    const updateCategoryButtons = (category: SearchCategory) => {
      categoryButtons.forEach(button => {
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

    const handleInput = (event: Event) => {
      const target = event.target as HTMLInputElement;
      currentQuery = target.value;
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
      } else if (event.key === 'Enter') {
        if (activeIndex >= 0 && currentResults[activeIndex]) {
          window.location.href = currentResults[activeIndex].href;
        }
      }
    };

    const handleCategoryClick = (event: Event) => {
      const button = event.currentTarget as HTMLButtonElement;
      const category = (button.dataset.category as SearchCategory) ?? 'all';
      activeCategory = category;
      updateCategoryButtons(category);
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
      try {
        const response = await fetch('/api/projects.json', { signal: abortController.signal });
        if (!response.ok) {
          throw new Error(`Failed to load projects (${response.status})`);
        }
        const json = await response.json();
        projectRecords = Array.isArray(json)
          ? json.map((item: ProjectAPIItem) => ({
              type: 'project' as const,
              title: item.title ?? 'Untitled project',
              description: item.description ?? '',
              href: `/projects/${item.slug}/`,
              tags: Array.isArray(item.tags) ? item.tags : [],
              featured: Boolean(item.featured)
            }))
          : [];
      } catch (error) {
        console.warn('Search overlay failed to load projects index', error);
        projectRecords = [];
      } finally {
        runSearch();
      }
    };

    updateCategoryButtons(activeCategory);
    runSearch();
    loadProjects();

    const overlayApi = {
      openSearchOverlay: openOverlay,
      closeSearchOverlay: closeOverlay,
    };
    win.enhancedSearchOverlay = overlayApi;
    win.searchOverlay = overlayApi;

    toggleButton?.addEventListener('click', handleToggleClick, { passive: false });
    closeButton?.addEventListener('click', handleCloseClick, { passive: false });
  backdropElement?.addEventListener('click', handleBackdrop as EventListener, { passive: true });

    doc.addEventListener('keydown', handleSlashShortcut, { passive: false });
    doc.addEventListener('keydown', handleMetaKShortcut, { passive: false });
    doc.addEventListener('keydown', handleEscape, { passive: false });
    doc.addEventListener('focusin', handleFocusTrap, { passive: true });

    searchInput?.addEventListener('input', handleInput, { passive: true });
    searchInput?.addEventListener('keydown', handleInputKeydown, { passive: false });

    categoryButtons.forEach((button) => {
      button.addEventListener('click', handleCategoryClick, { passive: true });
    });

    resultsContainer?.addEventListener('mouseenter', handleResultMouseEnter, { passive: true });
    resultsContainer?.addEventListener('mousemove', handleResultMouseEnter, { passive: true });
    resultsContainer?.addEventListener('focusin', handleResultFocus, { passive: true });

    return () => {
      cancelled = true;
      abortController.abort();
      toggleButton?.removeEventListener('click', handleToggleClick);
      closeButton?.removeEventListener('click', handleCloseClick);
  backdropElement?.removeEventListener('click', handleBackdrop as EventListener, { passive: true } as AddEventListenerOptions);
      doc.removeEventListener('keydown', handleSlashShortcut);
      doc.removeEventListener('keydown', handleMetaKShortcut);
      doc.removeEventListener('keydown', handleEscape);
      doc.removeEventListener('focusin', handleFocusTrap);
      searchInput?.removeEventListener('input', handleInput);
      searchInput?.removeEventListener('keydown', handleInputKeydown);
      categoryButtons.forEach((button) => {
        button.removeEventListener('click', handleCategoryClick);
      });
      resultsContainer?.removeEventListener('mouseenter', handleResultMouseEnter);
      resultsContainer?.removeEventListener('mousemove', handleResultMouseEnter);
      resultsContainer?.removeEventListener('focusin', handleResultFocus);
      if (win.enhancedSearchOverlay === overlayApi) {
        delete win.enhancedSearchOverlay;
      }
      if (win.searchOverlay === overlayApi) {
        delete win.searchOverlay;
      }
    };
  }, []);

  return null;
}

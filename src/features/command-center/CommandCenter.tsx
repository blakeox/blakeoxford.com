import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { handoffToAiChat } from '../../lib/chat/ai-chat-bridge';
import { useOverlayScrollLock } from '../../hooks/useOverlayScrollLock';
import { useTouchGestures } from '../../lib/hooks/useTouchGestures';
import { createFocusTrap } from '../../utils/focusTrap';
import { OverlayShell } from '../overlay';
import { OVERLAY_CLOSE_BUTTON, OVERLAY_FIELD, OVERLAY_HEADER } from '../overlay/overlayStyles';
import { CommandCategoryFilters } from './components/CommandCategoryFilters';
import {
 CommandDestinationList,
 CommandEmpty,
 CommandFooter,
 CommandRecentList,
} from './components/CommandEmpty';
import { CommandGroupSection, CommandSkeletonList } from './components/CommandGroup';
import { CommandResultRow } from './components/CommandResultRow';
import { CommandTitleSuggestions } from './components/CommandTitleSuggestions';
import { useCommandCenter } from './hooks/useCommandCenter';
import { useCommandHistory } from './hooks/useCommandHistory';
import { useCommandQuery } from './hooks/useCommandQuery';
import { commandCenterEvents, type CommandCenterHandoffSource } from './lib/analytics';
import { flattenGroups } from './lib/groupResults';
import type { CommandCategory, CommandItem } from './types';

/**
 * Site search — navigate pages, projects, and posts.
 * Ask lives in the corner companion; search stays search-like.
 */
export default function CommandCenter() {
 const { isOpen, close: closeCommandCenter, seedQuery, clearSeedQuery } = useCommandCenter();
 const { releaseNow: releaseScrollLockNow } = useOverlayScrollLock(isOpen);
 const {
 recentQueries,
 recentDestinations,
 pushQuery,
 pushDestination,
 clearHistory,
 } = useCommandHistory();
 const {
 query,
 setQuery,
 category,
 setCategory,
 groups,
 isLoading,
 error,
 searchSource,
 } = useCommandQuery(isOpen);

 const [activeIndex, setActiveIndex] = useState(0);
 const [copiedHref, setCopiedHref] = useState<string | null>(null);
 const inputRef = useRef<HTMLInputElement>(null);
 const panelRef = useRef<HTMLDivElement>(null);
 const listRef = useRef<HTMLDivElement>(null);
 const focusTrapRef = useRef<ReturnType<typeof createFocusTrap> | null>(null);
 const emptyTrackedRef = useRef<string | null>(null);

 useEffect(() => {
 if (!seedQuery) return;
 setQuery(seedQuery);
 clearSeedQuery();
 }, [seedQuery, setQuery, clearSeedQuery]);

 const findQuery = query.trim();

 // Reset type filter when the query is cleared
 useEffect(() => {
 if (!findQuery && category !== 'all') {
 setCategory('all');
 }
 }, [findQuery, category, setCategory]);

 const flatBrowseGroups = useMemo(() => {
 if (findQuery) return groups;
 if (recentQueries.length > 0 || recentDestinations.length > 0) {
 return groups.filter((group) => group.id !== 'recent');
 }
 return groups;
 }, [findQuery, groups, recentQueries.length, recentDestinations.length]);

 const flatItems = useMemo(() => flattenGroups(flatBrowseGroups), [flatBrowseGroups]);
 const hasResults = flatItems.length > 0;

 const close = useCallback(() => {
 releaseScrollLockNow();
 focusTrapRef.current?.deactivate();
 closeCommandCenter();
 }, [closeCommandCenter, releaseScrollLockNow]);

 const { handleTouchStart, handleTouchMove, handleTouchEnd } = useTouchGestures({
 enabled: isOpen,
 swipeThreshold: 100,
 onSwipeDown: close,
 });

 const askAi = useCallback(
 (prompt: string, analyticsSource: CommandCenterHandoffSource = 'empty_state') => {
 const trimmed = prompt.trim();
 if (!trimmed) return;

 pushQuery(trimmed);
 commandCenterEvents.askHandoff({
 source: analyticsSource,
 query_length: trimmed.length,
 auto_send: true,
 });
 handoffToAiChat({
 query: trimmed,
 autoSend: true,
 });
 close();
 },
 [close, pushQuery],
 );

 useEffect(() => {
 if (!isOpen) {
 focusTrapRef.current?.deactivate();
 setActiveIndex(0);
 return;
 }

 const toggleButton = document.getElementById('search-toggle');
 focusTrapRef.current = createFocusTrap(panelRef.current, {
 initialFocus: inputRef.current,
 returnFocus: toggleButton,
 fallbackFocus: panelRef.current,
 });
 focusTrapRef.current.activate();

 const timer = window.setTimeout(() => inputRef.current?.focus(), 50);

 return () => {
 window.clearTimeout(timer);
 focusTrapRef.current?.deactivate();
 };
 }, [isOpen]);

 useEffect(() => {
 focusTrapRef.current?.update();
 }, [flatItems.length, isLoading]);

 useEffect(() => {
 if (!hasResults) {
 setActiveIndex(-1);
 return;
 }
 setActiveIndex((prev) => {
 if (prev < 0 || prev >= flatItems.length) return 0;
 return prev;
 });
 }, [flatItems.length, hasResults, findQuery, category]);

 const navigateTo = useCallback(
 (item: CommandItem, newTab = false) => {
 commandCenterEvents.resultClick({ kind: item.kind, href: item.href });
 pushQuery(findQuery || query);
 pushDestination({ title: item.title, href: item.href });
 close();
 if (newTab) {
 window.open(item.href, '_blank', 'noopener,noreferrer');
 } else {
 window.location.href = item.href;
 }
 },
 [close, findQuery, pushDestination, pushQuery, query],
 );

 const handleCategoryChange = useCallback(
 (next: CommandCategory) => {
 setCategory(next);
 commandCenterEvents.filterChange(next);
 },
 [setCategory],
 );

 const copyActiveLink = useCallback(
 async (item?: CommandItem) => {
 const target = item ?? (activeIndex >= 0 ? flatItems[activeIndex] : undefined);
 if (!target) return;
 try {
 const absolute = new URL(target.href, window.location.origin).toString();
 await navigator.clipboard.writeText(absolute);
 setCopiedHref(target.href);
 commandCenterEvents.copyLink(target.kind);
 window.setTimeout(() => {
 setCopiedHref((prev) => (prev === target.href ? null : prev));
 }, 1600);
 } catch {
 // Clipboard can fail in restricted contexts — keep silent
 }
 },
 [activeIndex, flatItems],
 );

 const askAboutItemWithContext = useCallback(
 (item: CommandItem) => {
 pushQuery(findQuery || query);
 commandCenterEvents.askHandoff({
 source: 'result_row',
 query_length: (findQuery || item.title).length,
 item_kind: item.kind,
 auto_send: true,
 });
 handoffToAiChat({
 query: findQuery || item.title,
 autoSend: true,
 sourceHref: item.href,
 sourceTitle: item.title,
 sourceKind: item.kind,
 });
 close();
 },
 [close, findQuery, pushQuery, query],
 );

 const handleTagClick = useCallback(
 (tag: string) => {
 setQuery(tag);
 setCategory('all');
 commandCenterEvents.tagDrillIn(tag.length);
 inputRef.current?.focus();
 },
 [setCategory, setQuery],
 );

 useEffect(() => {
 if (!isOpen) return;
 const onCopyShortcut = (event: KeyboardEvent) => {
 const meta = event.metaKey || event.ctrlKey;
 if (!meta || event.key.toLowerCase() !== 'c') return;
 // Don't steal copy when the user is selecting input text
 const selection = window.getSelection()?.toString();
 if (selection && selection.length > 0 && document.activeElement === inputRef.current) {
 return;
 }
 if (activeIndex < 0 || !flatItems[activeIndex]) return;
 event.preventDefault();
 void copyActiveLink(flatItems[activeIndex]);
 };
 document.addEventListener('keydown', onCopyShortcut);
 return () => document.removeEventListener('keydown', onCopyShortcut);
 }, [activeIndex, copyActiveLink, flatItems, isOpen]);

 useEffect(() => {
 if (!isOpen || isLoading || !findQuery || hasResults) {
 if (!findQuery) emptyTrackedRef.current = null;
 return;
 }
 if (emptyTrackedRef.current === findQuery) return;
 emptyTrackedRef.current = findQuery;
 commandCenterEvents.emptyImpression(findQuery.length);
 }, [findQuery, hasResults, isLoading, isOpen]);

 const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
 if (event.key === 'Escape') {
 event.preventDefault();
 if (query.trim()) {
 setQuery('');
 setCategory('all');
 } else {
 close();
 }
 return;
 }

 if (event.key === 'Tab' && findQuery.length >= 2 && flatItems.length > 0) {
 const firstTitle = flatItems.find((item) =>
 item.title.toLowerCase().includes(findQuery.toLowerCase()),
 );
 if (firstTitle && firstTitle.title.toLowerCase() !== findQuery.toLowerCase()) {
 event.preventDefault();
 setQuery(firstTitle.title);
 return;
 }
 }

 if (!flatItems.length) return;

 if (event.key === 'ArrowDown') {
 event.preventDefault();
 setActiveIndex((prev) => (prev < 0 ? 0 : (prev + 1) % flatItems.length));
 } else if (event.key === 'ArrowUp') {
 event.preventDefault();
 setActiveIndex((prev) => (prev <= 0 ? flatItems.length - 1 : prev - 1));
 } else if (event.key === 'Enter') {
 const index = activeIndex >= 0 ? activeIndex : 0;
 if (flatItems[index]) {
 event.preventDefault();
 navigateTo(flatItems[index], event.metaKey || event.ctrlKey);
 }
 }
 };

 useEffect(() => {
 if (activeIndex < 0 || !listRef.current) return;
 const node = listRef.current.querySelector<HTMLElement>(`#command-result-${activeIndex}`);
 node?.scrollIntoView({ block: 'nearest' });
 inputRef.current?.setAttribute('aria-activedescendant', `command-result-${activeIndex}`);
 }, [activeIndex]);

 if (typeof document === 'undefined') return null;

 let resultIndex = -1;

 const overlay = (
 <OverlayShell
 id="search-overlay"
 isOpen={isOpen}
 onClose={close}
 labelledBy="command-center-title"
 panelRef={panelRef}
 variant="find"
 rootProps={{
 'data-command-center': true,
 'data-search-loading': isLoading ? 'true' : 'false',
 // Visibility + layout come from OverlayShell (.overlay-root, data-state).
 className: 'command-center group',
 }}
 onPanelClick={(event) => event.stopPropagation()}
 onTouchStart={handleTouchStart}
 onTouchMove={handleTouchMove}
 onTouchEnd={handleTouchEnd}
 >
 <div className={OVERLAY_HEADER}>
 <div className={OVERLAY_FIELD}>
 <svg
 className="size-4 shrink-0 text-subtle-foreground"
 viewBox="0 0 24 24"
 fill="none"
 stroke="currentColor"
 strokeWidth={1.8}
 aria-hidden="true"
 >
 <path
 strokeLinecap="round"
 strokeLinejoin="round"
 d="M21 21l-4.8-4.8M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
 />
 </svg>
 <input
 ref={inputRef}
 id="search-input"
 type="search"
 role="combobox"
 inputMode="search"
 enterKeyHint="search"
 aria-expanded={hasResults}
 aria-controls="search-results"
 aria-autocomplete="list"
 aria-activedescendant={activeIndex >= 0 ? `command-result-${activeIndex}` : undefined}
 value={query}
 onChange={(event) => {
 setQuery(event.target.value);
 }}
 onKeyDown={handleInputKeyDown}
 placeholder="Search pages, projects, and posts…"
 aria-label="Search site content"
 autoComplete="off"
 spellCheck={false}
 className="min-w-0 flex-1 bg-transparent text-base text-foreground placeholder:text-subtle-foreground/70 focus:outline-none"
 />
 {query ? (
 <button
 type="button"
 className="rounded-md p-1 text-subtle-foreground hover:text-foreground"
 aria-label="Clear search"
 onClick={() => {
 setQuery('');
 setCategory('all');
 inputRef.current?.focus();
 }}
 >
 <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
 <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
 </svg>
 </button>
 ) : null}
 {isLoading ? (
 <span
 className="size-3.5 shrink-0 animate-spin rounded-full border-2 border-accent/30 border-t-accent"
 aria-hidden="true"
 />
 ) : null}
 </div>
 <button
 id="close-search"
 type="button"
 className={OVERLAY_CLOSE_BUTTON}
 aria-label="Close search"
 onClick={close}
 >
 <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
 </svg>
 </button>
 </div>

 <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-4" ref={listRef}>
 <h2 id="command-center-title" className="sr-only">
 Search
 </h2>
 <p className="sr-only" aria-live="polite" aria-atomic="true">
 {isLoading
 ? 'Searching…'
 : hasResults
 ? `${flatItems.length} results${findQuery ? ` for ${findQuery}` : ''}`
 : findQuery
 ? `No results for ${findQuery}`
 : 'Start typing to search the site'}
 </p>

 {error ? (
 <div className="mb-3 rounded-lg border border-border/60 bg-surface/80 px-3 py-2.5 text-sm text-muted-foreground">
 {error}
 </div>
 ) : null}

 {findQuery ? (
 <CommandCategoryFilters category={category} onChange={handleCategoryChange} />
 ) : null}

 {!findQuery && recentQueries.length > 0 ? (
 <CommandRecentList
 recentQueries={recentQueries}
 onSelect={(value) => {
 commandCenterEvents.recentClick(value.trim().length);
 setQuery(value);
 }}
 onClear={clearHistory}
 />
 ) : null}

 {!findQuery && recentDestinations.length > 0 ? (
 <CommandDestinationList
 destinations={recentDestinations}
 onSelect={(destination) => {
 commandCenterEvents.suggestionClick('destination');
 pushDestination(destination);
 close();
 window.location.href = destination.href;
 }}
 />
 ) : null}

 {isLoading && !hasResults ? <CommandSkeletonList /> : null}

 {!isLoading && findQuery && !hasResults ? (
 <CommandEmpty
 query={findQuery}
 onSuggestion={(value) => {
 commandCenterEvents.suggestionClick('empty_chip');
 setQuery(value);
 }}
 onAskAi={(value) => askAi(value, 'empty_state')}
 />
 ) : null}

 {findQuery && hasResults ? (
 <CommandTitleSuggestions
 query={findQuery}
 items={flatItems}
 onSelect={(title) => {
 commandCenterEvents.suggestionClick('title_autocomplete');
 setQuery(title);
 inputRef.current?.focus();
 }}
 />
 ) : null}

 {hasResults ? (
 <div
 id="search-results"
 role="listbox"
 aria-label="Search results"
 data-results
 className="flex flex-col gap-3"
 >
 {findQuery ? (
 <p className="sr-only">Use arrow keys to navigate results. Press Enter to open. Press Command C to copy the active link.</p>
 ) : null}
 <div data-results-container className="flex flex-col gap-3">
 {flatBrowseGroups.map((group) => (
 <CommandGroupSection key={group.id} label={group.label}>
 {group.items.map((item) => {
 resultIndex += 1;
 const index = resultIndex;
 return (
 <CommandResultRow
 key={item.id}
 item={item}
 index={index}
 query={findQuery}
 isActive={index === activeIndex}
 onSelect={(selected) => navigateTo(selected)}
 onHover={setActiveIndex}
 onAsk={askAboutItemWithContext}
 onCopyLink={(selected) => {
 void copyActiveLink(selected);
 }}
 onTagClick={handleTagClick}
 linkCopied={copiedHref === item.href}
 />
 );
 })}
 </CommandGroupSection>
 ))}
 </div>
 </div>
 ) : null}
 </div>

 <CommandFooter searchSource={searchSource} showCopyHint={hasResults} />
 </OverlayShell>
 );

 return createPortal(overlay, document.body);
}

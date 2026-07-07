/**
 * Coordinates header overlays (mobile menu, search): escape routing,
 * mutual exclusion, and close callbacks registered by each feature.
 */

type EscapeHandler = {
  id: string;
  priority: number;
  isActive: () => boolean;
  handle: (event: KeyboardEvent) => void;
};

const escapeHandlers: EscapeHandler[] = [];
let escapeListenerAttached = false;

let closeMobileMenuFn: (() => void) | null = null;
let closeSearchFn: (() => void) | null = null;
let closeAiChatFn: (() => void) | null = null;

function globalEscapeHandler(event: KeyboardEvent): void {
  if (event.key !== 'Escape') return;

  for (const handler of escapeHandlers) {
    if (handler.isActive()) {
      event.preventDefault();
      handler.handle(event);
      return;
    }
  }
}

function ensureEscapeListener(): void {
  if (escapeListenerAttached || typeof document === 'undefined') return;
  document.addEventListener('keydown', globalEscapeHandler);
  escapeListenerAttached = true;
}

function removeEscapeListenerIfIdle(): void {
  if (!escapeListenerAttached || escapeHandlers.length > 0) return;
  document.removeEventListener('keydown', globalEscapeHandler);
  escapeListenerAttached = false;
}

export function registerEscapeHandler(handler: EscapeHandler): () => void {
  escapeHandlers.push(handler);
  escapeHandlers.sort((a, b) => b.priority - a.priority);
  ensureEscapeListener();

  return () => {
    const index = escapeHandlers.indexOf(handler);
    if (index >= 0) escapeHandlers.splice(index, 1);
    removeEscapeListenerIfIdle();
  };
}

export function registerMobileMenuClose(fn: () => void): () => void {
  closeMobileMenuFn = fn;
  return () => {
    if (closeMobileMenuFn === fn) closeMobileMenuFn = null;
  };
}

export function registerSearchClose(fn: () => void): () => void {
  closeSearchFn = fn;
  return () => {
    if (closeSearchFn === fn) closeSearchFn = null;
  };
}

export function registerAiChatClose(fn: () => void): () => void {
  closeAiChatFn = fn;
  return () => {
    if (closeAiChatFn === fn) closeAiChatFn = null;
  };
}

export function closeMobileMenu(): void {
  closeMobileMenuFn?.();
}

export function closeSearch(): void {
  closeSearchFn?.();
}

export function closeAiChat(): void {
  closeAiChatFn?.();
}

/** Close every registered header overlay (mobile menu, search, AI chat). */
export function closeAllHeaderOverlays(): void {
  closeMobileMenu();
  closeSearch();
  closeAiChat();
}

export function resetHeaderControllerForTests(): void {
  escapeHandlers.length = 0;
  closeMobileMenuFn = null;
  closeSearchFn = null;
  closeAiChatFn = null;
  if (escapeListenerAttached && typeof document !== 'undefined') {
    document.removeEventListener('keydown', globalEscapeHandler);
    escapeListenerAttached = false;
  }
}

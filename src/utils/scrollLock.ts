/**
 * Reference-counted body scroll lock with scroll-position preservation.
 * Multiple overlays (mobile menu, search) can acquire independently;
 * scroll is restored only when every holder has released.
 */

const SCROLL_LOCK_CLASS = 'scroll-locked';

let lockCount = 0;
let savedScrollY = 0;

function getScrollbarWidth(): number {
  return Math.max(0, window.innerWidth - document.documentElement.clientWidth);
}

function applyScrollLockStyles(): void {
  savedScrollY = window.scrollY;
  const scrollbarWidth = getScrollbarWidth();

  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
  document.body.style.position = 'fixed';
  document.body.style.top = `-${savedScrollY}px`;
  document.body.style.left = '0';
  document.body.style.right = '0';
  document.body.style.width = 'auto';

  if (scrollbarWidth > 0) {
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    document.documentElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
  }

  document.body.classList.add(SCROLL_LOCK_CLASS);
}

function clearScrollLockStyles(): void {
  document.documentElement.style.overflow = '';
  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.left = '';
  document.body.style.right = '';
  document.body.style.width = '';
  document.body.style.paddingRight = '';
  document.documentElement.style.removeProperty('--scrollbar-width');
  document.body.classList.remove(SCROLL_LOCK_CLASS);
  window.scrollTo(0, savedScrollY);
}

export function acquireScrollLock(): void {
  if (typeof document === 'undefined') return;

  if (lockCount === 0) {
    applyScrollLockStyles();
  }
  lockCount += 1;
}

export function releaseScrollLock(): void {
  if (typeof document === 'undefined') return;
  if (lockCount <= 0) return;

  lockCount -= 1;
  if (lockCount > 0) return;

  clearScrollLockStyles();
}

export function isScrollLocked(): boolean {
  return lockCount > 0;
}

export function resetScrollLockForTests(): void {
  lockCount = 0;
  savedScrollY = 0;
  if (typeof document !== 'undefined') {
    clearScrollLockStyles();
  }
}

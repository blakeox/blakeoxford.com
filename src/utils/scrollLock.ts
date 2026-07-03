/**
 * Reference-counted body scroll lock with scroll-position preservation.
 * Multiple overlays (mobile menu, search) can acquire independently;
 * scroll is restored only when every holder has released.
 */

let lockCount = 0;
let savedScrollY = 0;

export function acquireScrollLock(): void {
  if (typeof document === 'undefined') return;

  if (lockCount === 0) {
    savedScrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.width = '100%';
  }
  lockCount += 1;
}

export function releaseScrollLock(): void {
  if (typeof document === 'undefined') return;
  if (lockCount <= 0) return;

  lockCount -= 1;
  if (lockCount > 0) return;

  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  window.scrollTo(0, savedScrollY);
}

export function isScrollLocked(): boolean {
  return lockCount > 0;
}

export function resetScrollLockForTests(): void {
  lockCount = 0;
  savedScrollY = 0;
  if (typeof document !== 'undefined') {
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
  }
}

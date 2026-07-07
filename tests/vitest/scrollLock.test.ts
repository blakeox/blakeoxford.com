import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  acquireScrollLock,
  forceReleaseScrollLock,
  releaseScrollLock,
  isScrollLocked,
  resetScrollLockForTests,
} from '../../src/utils/scrollLock';

describe('scrollLock', () => {
  beforeEach(() => {
    resetScrollLockForTests();
    document.body.style.cssText = '';
    document.documentElement.style.cssText = '';
    document.body.className = '';
  });

  afterEach(() => {
    resetScrollLockForTests();
  });

  it('locks body on first acquire', () => {
    acquireScrollLock();
    expect(isScrollLocked()).toBe(true);
    expect(document.body.style.overflow).toBe('hidden');
    expect(document.body.style.position).toBe('fixed');
    expect(document.body.classList.contains('scroll-locked')).toBe(true);
  });

  it('keeps lock until all holders release', () => {
    acquireScrollLock();
    acquireScrollLock();
    releaseScrollLock();
    expect(isScrollLocked()).toBe(true);
    releaseScrollLock();
    expect(isScrollLocked()).toBe(false);
    expect(document.body.style.overflow).toBe('');
    expect(document.body.classList.contains('scroll-locked')).toBe(false);
  });

  it('ignores release when no lock is held', () => {
    releaseScrollLock();
    expect(isScrollLocked()).toBe(false);
    expect(document.body.style.position).toBe('');
  });

  it('uses left/right anchoring instead of width 100%', () => {
    acquireScrollLock();
    expect(document.body.style.left).toBe('0px');
    expect(document.body.style.right).toBe('0px');
    expect(document.body.style.width).toBe('auto');
  });

  it('forceReleaseScrollLock clears a stuck lock', () => {
    acquireScrollLock();
    acquireScrollLock();
    forceReleaseScrollLock();
    expect(isScrollLocked()).toBe(false);
    expect(document.body.style.position).toBe('');
  });
});

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { acquireScrollLock, releaseScrollLock, isScrollLocked, resetScrollLockForTests } from '../../src/utils/scrollLock';

describe('scrollLock', () => {
  beforeEach(() => {
    resetScrollLockForTests();
    document.body.style.cssText = '';
  });

  afterEach(() => {
    resetScrollLockForTests();
  });

  it('locks body on first acquire', () => {
    acquireScrollLock();
    expect(isScrollLocked()).toBe(true);
    expect(document.body.style.overflow).toBe('hidden');
    expect(document.body.style.position).toBe('fixed');
  });

  it('keeps lock until all holders release', () => {
    acquireScrollLock();
    acquireScrollLock();
    releaseScrollLock();
    expect(isScrollLocked()).toBe(true);
    releaseScrollLock();
    expect(isScrollLocked()).toBe(false);
    expect(document.body.style.overflow).toBe('');
  });
});

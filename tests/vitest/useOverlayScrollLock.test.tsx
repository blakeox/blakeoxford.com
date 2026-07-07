import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { useState } from 'react';

import { useOverlayScrollLock } from '../../src/hooks/useOverlayScrollLock';
import {
  acquireScrollLock,
  isScrollLocked,
  resetScrollLockForTests,
} from '../../src/utils/scrollLock';

function ScrollLockHarness() {
  const [enabled, setEnabled] = useState(false);
  const { releaseNow } = useOverlayScrollLock(enabled);

  return (
    <div>
      <button type="button" onClick={() => setEnabled(true)}>
        Enable
      </button>
      <button type="button" onClick={() => setEnabled(false)}>
        Disable
      </button>
      <button type="button" onClick={() => releaseNow()}>
        Release now
      </button>
    </div>
  );
}

describe('useOverlayScrollLock', () => {
  beforeEach(() => {
    resetScrollLockForTests();
    document.body.style.cssText = '';
    document.body.className = '';
  });

  afterEach(() => {
    resetScrollLockForTests();
  });

  it('acquires and releases scroll lock with enabled state', async () => {
    const { getByRole } = render(<ScrollLockHarness />);

    await act(async () => {
      getByRole('button', { name: 'Enable' }).click();
    });
    expect(isScrollLocked()).toBe(true);

    await act(async () => {
      getByRole('button', { name: 'Disable' }).click();
    });
    expect(isScrollLocked()).toBe(false);
  });

  it('releaseNow clears lock synchronously while still enabled', async () => {
    const { getByRole } = render(<ScrollLockHarness />);

    await act(async () => {
      getByRole('button', { name: 'Enable' }).click();
    });
    expect(isScrollLocked()).toBe(true);

    await act(async () => {
      getByRole('button', { name: 'Release now' }).click();
    });
    expect(isScrollLocked()).toBe(false);
    expect(document.body.style.position).toBe('');
  });

  it('does not release locks owned by another overlay', () => {
    acquireScrollLock();
    const { getByRole } = render(<ScrollLockHarness />);

    getByRole('button', { name: 'Enable' }).click();
    expect(isScrollLocked()).toBe(true);

    getByRole('button', { name: 'Release now' }).click();
    expect(isScrollLocked()).toBe(true);
  });
});

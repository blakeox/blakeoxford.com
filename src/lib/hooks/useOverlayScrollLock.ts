import { useCallback, useEffect, useRef } from 'react';

import { acquireScrollLock, releaseScrollLock } from '@/utils/scrollLock';

/**
 * Reference-counted scroll lock for a single overlay owner.
 * Call `releaseNow()` synchronously when closing to avoid layout drift during route changes.
 */
export function useOverlayScrollLock(enabled: boolean) {
  const heldRef = useRef(false);

  const releaseNow = useCallback(() => {
    if (!heldRef.current) return;
    releaseScrollLock();
    heldRef.current = false;
  }, []);

  useEffect(() => {
    if (enabled) {
      if (!heldRef.current) {
        acquireScrollLock();
        heldRef.current = true;
      }
    } else {
      releaseNow();
    }

    return releaseNow;
  }, [enabled, releaseNow]);

  return { releaseNow };
}

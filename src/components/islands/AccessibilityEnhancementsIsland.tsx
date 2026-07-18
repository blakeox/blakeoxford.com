import { useEffect } from 'react';
import { initMotionAccessibility } from '../../scripts/modules/MotionAccessibility';

const SKIP_LINK_SELECTOR = 'a.skip-link[href="#main-content"]';
const MAIN_CONTENT_ID = 'main-content';

function setupSkipLinkFocus(): () => void {
  const skipLink = document.querySelector<HTMLAnchorElement>(SKIP_LINK_SELECTOR);
  const target = document.getElementById(MAIN_CONTENT_ID);

  if (!skipLink || !target) {
    return () => {};
  }

  const focusMain = () => {
    window.requestAnimationFrame(() => target.focus());
  };

  skipLink.addEventListener('click', focusMain);

  if (window.location.hash === `#${MAIN_CONTENT_ID}`) {
    focusMain();
  }

  return () => {
    skipLink.removeEventListener('click', focusMain);
  };
}

function setupFocusVisibleState(): () => void {
  const root = document.documentElement;
  const enable = () => root.classList.add('focus-visible');
  const disable = () => root.classList.remove('focus-visible');

  root.classList.add('focus-visible');

  const handlePointer = () => disable();
  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Tab') {
      enable();
    }
  };
  const handleBlur = () => disable();

  window.addEventListener('keydown', handleKeydown, { passive: true });
  window.addEventListener('pointerdown', handlePointer, { passive: true });
  window.addEventListener('touchstart', handlePointer, { passive: true });
  window.addEventListener('blur', handleBlur);

  return () => {
    window.removeEventListener('keydown', handleKeydown);
    window.removeEventListener('pointerdown', handlePointer);
    window.removeEventListener('touchstart', handlePointer);
    window.removeEventListener('blur', handleBlur);
  };
}

export default function AccessibilityEnhancementsIsland() {
  useEffect(() => {
    const cleanupFns: Array<() => void> = [];

    try {
      const motionController = initMotionAccessibility();
      motionController.registerToggles();
      // No teardown needed; singleton handles lifecycle
    } catch (error) {
      console.warn('Motion accessibility setup failed', error);
    }

    cleanupFns.push(setupSkipLinkFocus());
    cleanupFns.push(setupFocusVisibleState());

    return () => {
      cleanupFns.forEach((fn) => fn());
    };
  }, []);

  return <></>;
}

import { useEffect, useState } from 'react';

import { cn } from '@/utils/cn';
import { CHAT_LAUNCHER_BASE, CHAT_LAUNCHER_CLOSED } from './chatStyles';

/**
 * ChatLauncherIsland — accent FAB that opens the corner Ask companion.
 */
export default function ChatLauncherIsland() {
  const [isOpen, setIsOpen] = useState(false);
  const [isOccluded, setIsOccluded] = useState(false);

  useEffect(() => {
    try {
      (window as Window & { __ai_chat_hydrated?: boolean }).__ai_chat_hydrated = true;
    } catch {
      /* noop */
    }

    const onStateEvent = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail && typeof detail.open === 'boolean') {
        setIsOpen(detail.open);
      }
    };

    window.addEventListener('ai-chat:state', onStateEvent);

    const onContactPage = () =>
      document.body.dataset.hideAskLauncher === 'true' ||
      /\/contact\/?$/.test(window.location.pathname);

    const fabCollisionRect = () => {
      const compact = window.matchMedia('(min-width: 640px)').matches;
      const inset = compact ? 24 : 16;
      const size = compact ? 56 : 48;
      return {
        left: window.innerWidth - inset - size,
        top: window.innerHeight - inset - size,
        right: window.innerWidth - inset,
        bottom: window.innerHeight - inset,
      };
    };

    const overlapsFab = (target: HTMLElement) => {
      const a = target.getBoundingClientRect();
      const b = fabCollisionRect();
      return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    };

    const syncOcclusion = () => {
      if (onContactPage()) {
        setIsOccluded(true);
        return;
      }
      const target = document.querySelector<HTMLElement>('[data-chat-avoid-launcher]');
      setIsOccluded(Boolean(target && overlapsFab(target)));
    };

    syncOcclusion();
    window.addEventListener('scroll', syncOcclusion, { passive: true });
    window.addEventListener('resize', syncOcclusion);
    document.addEventListener('astro:page-load', syncOcclusion);

    return () => {
      window.removeEventListener('ai-chat:state', onStateEvent);
      window.removeEventListener('scroll', syncOcclusion);
      window.removeEventListener('resize', syncOcclusion);
      document.removeEventListener('astro:page-load', syncOcclusion);
    };
  }, []);

  const toggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    window.dispatchEvent(new CustomEvent('ai-chat:state', { detail: { open: next } }));
  };

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-chat-launcher sm:right-6 sm:bottom-6">
      {!isOpen && !isOccluded && (
        <button
          className={cn(CHAT_LAUNCHER_BASE, CHAT_LAUNCHER_CLOSED)}
          aria-label="Open Ask"
          aria-expanded={false}
          data-ai-launcher
          data-ai-action="open"
          type="button"
          onClick={toggle}
        >
          <svg
            className="size-5 sm:size-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 10h8m-8 3h5.5M21 11.5c0 4.418-4.03 8-9 8-1.15 0-2.26-.19-3.29-.54L3 21l1.1-3.3A8.35 8.35 0 0 1 3 11.5c0-4.418 4.03-8 9-8s9 3.582 9 8Z"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

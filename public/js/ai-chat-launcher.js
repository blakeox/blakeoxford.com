'use strict';

(function initAIChatLauncher() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const OPEN_EVENT = 'ai-chat:open';
  const TOGGLE_EVENT = 'ai-chat:toggle';
  const STATE_EVENT = 'ai-chat:state';

  const dispatch = (type) => {
    window.dispatchEvent(new CustomEvent(type, { detail: { source: 'launcher' } }));
  };

  const handleLauncherClick = (event) => {
    const trigger = event.currentTarget;
    if (!(trigger instanceof window.HTMLElement)) return;
    event.preventDefault();
    const action = trigger.dataset.aiAction || 'open';
    dispatch(action === 'toggle' ? TOGGLE_EVENT : OPEN_EVENT);
  };

  const syncExpanded = (open) => {
    document.querySelectorAll('[data-ai-launcher]').forEach((element) => {
      if (!(element instanceof window.HTMLElement)) return;
      element.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  };

  const attachLaunchers = () => {
    document.querySelectorAll('[data-ai-launcher]').forEach((element) => {
      if (!(element instanceof window.HTMLElement)) return;
      element.removeEventListener('click', handleLauncherClick);
      element.addEventListener('click', handleLauncherClick);
    });
  };

  document.addEventListener('astro:after-swap', attachLaunchers);
  document.addEventListener('DOMContentLoaded', attachLaunchers, { once: true });
  attachLaunchers();

  window.addEventListener(STATE_EVENT, (event) => {
    const detail = event instanceof CustomEvent ? event.detail : undefined;
    syncExpanded(Boolean(detail && detail.open));
  });

  // Keyboard shortcuts for Ask were removed — Cmd/Ctrl+K and / open site search.
})();

/** Shared class strings for the Ask corner companion (ChatDock + launcher). */

export const CHAT_DOCK_ROOT = 'ai-chat-overlay pointer-events-none fixed inset-0 z-chat';

export const CHAT_DOCK_BACKDROP =
  'pointer-events-auto absolute inset-0 cursor-pointer bg-overlay-scrim/30 backdrop-blur-[1px] sm:hidden';

export const CHAT_DOCK_FRAME =
  'pointer-events-none absolute inset-x-0 bottom-0 flex justify-center sm:inset-auto sm:bottom-[5.5rem] sm:right-6 sm:justify-end';

export const CHAT_DOCK_PANEL =
  'ai-chat-panel pointer-events-auto flex w-full flex-col overflow-hidden border border-border/50 bg-surface/92 shadow-overlay backdrop-blur-2xl max-h-[min(82dvh,40rem)] rounded-t-2xl sm:max-h-[min(72dvh,36rem)] sm:w-[min(100vw-3rem,26rem)] sm:rounded-2xl';

export const CHAT_DOCK_DRAG_HANDLE =
  'mx-auto mt-2.5 h-1 w-9 shrink-0 rounded-full bg-border/70 sm:hidden';

export const CHAT_LAUNCHER_BASE =
  'ai-chat-launcher touch-target focus-ring-interactive pointer-events-auto inline-flex size-12 items-center justify-center rounded-full shadow-lg transition duration-normal ease-standard motion-safe:hover:-translate-y-0.5 hover:shadow-lg motion-safe:active:translate-y-0 motion-reduce:transition-none sm:size-14';

// Keep the secondary launcher discoverable without competing with page CTAs.
export const CHAT_LAUNCHER_CLOSED =
  'border border-border/60 bg-glass/95 text-foreground backdrop-blur supports-[backdrop-filter]:bg-glass/90';

export const CHAT_ACCENT_CHIP =
  'inline-flex items-center gap-1 rounded-full bg-accent-subtle px-2 py-0.5 text-xxs font-medium text-accent';

/** Prefer getBadgeClasses({ variant: 'subtle'|'success'|…, size: 'xs' }) for status chips. */
export const CHAT_ACCENT_PILL =
  'inline-flex items-center rounded-full bg-accent-subtle px-2.5 py-1 text-xxs font-medium text-accent-emphasis';

export const CHAT_ACCENT_ICON_WELL =
  'inline-flex size-8 items-center justify-center rounded-full bg-accent-subtle text-base';

export const CHAT_TOGGLE_ACTIVE = 'border-accent/40 bg-accent-subtle text-accent';

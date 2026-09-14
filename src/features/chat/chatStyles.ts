/** Shared class strings for the Ask corner companion (ChatDock + launcher). */

import { OVERLAY_FAB_GLASS, OVERLAY_SURFACE_GLASS } from '@/features/overlay/overlayStyles';
import { getBadgeClasses, getChipClasses } from '@/lib/design-system/recipes';
import { cn } from '@/utils/cn';

export const CHAT_DOCK_ROOT = 'ai-chat-overlay pointer-events-none fixed inset-0 z-chat';

export const CHAT_DOCK_BACKDROP =
  'pointer-events-auto absolute inset-0 cursor-pointer bg-overlay-scrim/30 backdrop-blur-[1px] sm:hidden';

export const CHAT_DOCK_FRAME =
  'pointer-events-none absolute inset-x-0 bottom-0 flex justify-center sm:inset-auto sm:bottom-[5.5rem] sm:right-6 sm:justify-end';

/** Dock layout on shared overlay glass paint — not a second panel system. */
export const CHAT_DOCK_PANEL = cn(
  'ai-chat-panel pointer-events-auto flex max-h-[min(82dvh,40rem)] w-full flex-col overflow-hidden rounded-t-2xl sm:max-h-[min(72dvh,36rem)] sm:w-[min(100vw-3rem,26rem)] sm:rounded-2xl',
  OVERLAY_SURFACE_GLASS
);

export const CHAT_DOCK_DRAG_HANDLE =
  'mx-auto mt-2.5 h-1 w-9 shrink-0 rounded-full bg-border/70 sm:hidden';

export const CHAT_LAUNCHER_BASE =
  'ai-chat-launcher touch-target focus-ring-interactive pointer-events-auto inline-flex size-12 items-center justify-center rounded-full shadow-lg transition duration-normal ease-standard motion-safe:hover:-translate-y-0.5 hover:shadow-lg motion-safe:active:translate-y-0 motion-reduce:transition-none sm:size-14';

/** Closed FAB paint — re-exports OVERLAY_FAB_GLASS. */
export const CHAT_LAUNCHER_CLOSED = OVERLAY_FAB_GLASS;

/** Listening / status chip — thin wrapper over chipRecipe active paint. */
export const CHAT_ACCENT_CHIP = getChipClasses({
  variant: 'quiet',
  size: 'xs',
  shape: 'pill',
  active: true,
  className: 'gap-1 border-0 px-2 py-0.5',
});

/** Topic / collection pill — badgeRecipe subtle with accent emphasis. */
export const CHAT_ACCENT_PILL = getBadgeClasses({
  variant: 'subtle',
  size: 'xs',
  className: 'bg-accent-subtle text-accent-emphasis border-0',
});

/** @deprecated Prefer OVERLAY_ACCENT_ICON_WELL from overlayStyles. */
export { OVERLAY_ACCENT_ICON_WELL as CHAT_ACCENT_ICON_WELL } from '@/features/overlay/overlayStyles';

export const CHAT_TOGGLE_ACTIVE = 'border-accent/40 bg-accent-subtle text-accent';

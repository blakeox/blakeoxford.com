/** Shared class strings for Find (Command Center) and Ask (AI Chat) overlays. */

import { buttonRecipe, getChipClasses, getFieldShellClasses } from '@/lib/design-system/recipes';
import { cn } from '@/utils/cn';

export const OVERLAY_BACKDROP =
  'absolute inset-0 cursor-pointer bg-overlay-scrim/55 backdrop-blur-sm';

export const OVERLAY_PANEL =
  'overlay-panel flex max-h-[85dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl border border-border/50 bg-surface/95 shadow-overlay backdrop-blur-xl motion-safe:transition-transform motion-safe:duration-normal motion-safe:ease-standard sm:rounded-2xl motion-reduce:transition-none';

export const OVERLAY_PANEL_ASK =
  'overlay-panel flex max-h-[88dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl border border-border/60 bg-surface/95 shadow-lg backdrop-blur-xl motion-safe:transition-transform motion-safe:duration-normal motion-safe:ease-standard sm:max-h-[85dvh] sm:rounded-2xl motion-reduce:transition-none';

export const OVERLAY_FRAME =
  'relative flex min-h-full w-full items-end justify-center sm:items-start sm:px-4 sm:pb-8 sm:pt-16 md:pt-20 lg:pt-24';

export const OVERLAY_DRAG_HANDLE =
  'mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border/60 sm:hidden';

export const OVERLAY_HEADER = 'flex items-center gap-2 border-b border-border/60 px-3 py-3 sm:px-4';

export const OVERLAY_FIELD = getFieldShellClasses('flex-1 gap-2.5 px-3.5 py-2.5');

/** Close control: recipe paint + explicit touch box (no size axis — avoids px/min conflicts). */
export const OVERLAY_CLOSE_BUTTON = cn(
  buttonRecipe.base,
  buttonRecipe.variants.secondary,
  'touch-target size-10 min-h-[2.75rem] min-w-[2.75rem] shrink-0 rounded-lg border-border/80 p-0'
);

/** Header icon control: recipe chrome without a bg fill so active toggles can paint. */
export const OVERLAY_ICON_BUTTON = cn(
  buttonRecipe.base,
  'size-8 shrink-0 rounded-lg border border-border/50 p-0 text-muted-foreground hover:border-accent/50 hover:text-accent'
);

export const OVERLAY_FOOTER =
  'border-t border-border/40 px-4 py-2 text-xxs text-subtle-foreground sm:text-xs';

export const SUGGESTION_CHIP = getChipClasses({
  variant: 'quiet',
  size: 'sm',
  shape: 'pill',
  className:
    'border-border/55 bg-surface/40 hover:border-accent/40 hover:bg-accent-subtle hover:text-accent-emphasis',
});

export const SUGGESTION_CHIP_ACCENT = getChipClasses({
  variant: 'accent',
  size: 'sm',
  shape: 'pill',
  className: 'gap-2',
});

export const SECTION_LABEL =
  'px-1 text-xxs font-semibold uppercase tracking-label text-subtle-foreground';

export const RESULT_ROW_BASE = 'flex items-center gap-3 rounded-lg px-3 py-2 transition-colors';

export const RESULT_ROW_ACTIVE = 'bg-accent-subtle ring-1 ring-inset ring-accent/25';
export const RESULT_ROW_IDLE = 'hover:bg-surface-subtle';

/** Quiet selectable rows in Find/Ask lists (recents, titles, fallback links). */
export const OVERLAY_SOFT_ROW =
  'focus-ring-interactive flex w-full items-center justify-between gap-2 rounded-lg text-left text-sm text-foreground transition hover:bg-surface-subtle';

export const OVERLAY_SOFT_ROW_PAD = 'px-3 py-2';
export const OVERLAY_SOFT_ROW_PAD_COMPACT = 'px-2 py-1.5';

export function getOverlaySoftRowClasses(compact = false) {
  return cn(OVERLAY_SOFT_ROW, compact ? OVERLAY_SOFT_ROW_PAD_COMPACT : OVERLAY_SOFT_ROW_PAD);
}

/** Compact dismiss control (no size-8 from OVERLAY_ICON_BUTTON). */
export const OVERLAY_DISMISS_BUTTON = cn(
  buttonRecipe.base,
  'size-7 shrink-0 rounded-lg border-0 p-0 text-subtle-foreground hover:bg-surface-subtle hover:text-foreground'
);

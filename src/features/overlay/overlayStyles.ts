/** Shared class strings for Find (Command Center) and Ask (AI Chat) overlays. */

import { buttonRecipe, getChipClasses, getFieldShellClasses } from '@/lib/design-system/recipes';
import { cn } from '@/utils/cn';

export const OVERLAY_BACKDROP =
  'absolute inset-0 cursor-pointer bg-overlay-scrim/55 backdrop-blur-sm';

/**
 * Shared Find/Ask panel glass paint — one surface contract for modal + dock shells.
 * Layout axes (max-h, width, motion) stay on the panel/dock constants below.
 */
export const OVERLAY_SURFACE_GLASS =
  'border border-border/50 bg-surface/95 shadow-overlay backdrop-blur-xl';

/** Secondary FAB glass — discoverable without competing with page CTAs. */
export const OVERLAY_FAB_GLASS =
  'border border-border/60 bg-glass/95 text-foreground backdrop-blur supports-[backdrop-filter]:bg-glass/90';

export const OVERLAY_PANEL = cn(
  'overlay-panel flex max-h-[85dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl motion-safe:transition-transform motion-safe:duration-normal motion-safe:ease-standard motion-reduce:transition-none sm:rounded-2xl',
  OVERLAY_SURFACE_GLASS
);

export const OVERLAY_PANEL_ASK = cn(
  'overlay-panel flex max-h-[88dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl motion-safe:transition-transform motion-safe:duration-normal motion-safe:ease-standard motion-reduce:transition-none sm:max-h-[85dvh] sm:rounded-2xl',
  OVERLAY_SURFACE_GLASS
);

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

/** Quiet informational panels (errors, notices) inside Find/Ask. */
export const OVERLAY_INFO_PANEL =
  'rounded-lg border border-border/60 bg-surface-subtle/60 px-3 py-2 text-sm text-muted-foreground';

/** Accent callout panel for matched CTAs. */
export const OVERLAY_ACCENT_PANEL = 'rounded-lg border border-accent/25 bg-accent-subtle p-3';

/** Quiet Ask section band (analytics, digest, guided prompts). */
export const OVERLAY_SECTION_BAND =
  'border-b border-border/20 bg-surface-subtle/20 px-4 py-3 text-xs text-muted-foreground';

/** Compact status strip (e.g. "Started fresh"). */
export const OVERLAY_NOTICE_STRIP =
  'shrink-0 border-b border-border/30 bg-surface-subtle/50 px-3.5 py-1.5 text-xxs text-muted-foreground sm:px-4';

/** Nested metric / citation tiles inside Ask analytics. */
export const OVERLAY_METRIC_TILE = 'rounded-xl border border-border/30 px-3 py-2';

/** Floating options menu panel (Ask header). */
export const OVERLAY_MENU_PANEL =
  'fixed z-[1300] min-w-[11rem] overflow-hidden rounded-xl border border-border/60 bg-surface py-1 shadow-lg';

/** Menu item rows inside OVERLAY_MENU_PANEL. */
export const OVERLAY_MENU_ITEM = cn(
  'focus-ring-interactive flex w-full items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-left text-sm text-foreground transition hover:bg-surface-subtle'
);

/** Footer prompt bar ("Want to start fresh?"). */
export const OVERLAY_PROMPT_BAR =
  'flex items-center justify-between gap-2 border-t border-border/40 bg-surface-subtle/40 px-4 py-2 text-xxs text-muted-foreground';

/** Shared class strings for Find (Command Center) and Ask (AI Chat) overlays. */

export const OVERLAY_BACKDROP =
  'absolute inset-0 cursor-pointer bg-background-dark/55 backdrop-blur-sm';

export const OVERLAY_PANEL =
  'overlay-panel flex max-h-[85dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl border border-border/60 bg-surface/95 shadow-lg backdrop-blur-xl motion-safe:transition-transform motion-safe:duration-normal motion-safe:ease-standard sm:rounded-2xl motion-reduce:transition-none';

export const OVERLAY_PANEL_ASK =
  'overlay-panel flex max-h-[88dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl border border-border/60 bg-surface/95 shadow-lg backdrop-blur-xl motion-safe:transition-transform motion-safe:duration-normal motion-safe:ease-standard sm:max-h-[85dvh] sm:rounded-2xl motion-reduce:transition-none';

export const OVERLAY_FRAME =
  'relative flex min-h-full w-full items-end justify-center sm:items-start sm:px-4 sm:pb-8 sm:pt-16 md:pt-20 lg:pt-24';

export const OVERLAY_DRAG_HANDLE =
  'mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border/60 sm:hidden';

export const OVERLAY_HEADER =
  'flex items-center gap-2 border-b border-border/60 px-3 py-3 sm:px-4';

export const OVERLAY_FIELD =
  'relative flex min-w-0 flex-1 items-center gap-2.5 rounded-lg border border-border/60 bg-field-bg px-3 py-2 focus-within:border-accent/60 focus-within:ring-2 focus-within:ring-accent/30';

export const OVERLAY_CLOSE_BUTTON =
  'touch-target focus-ring-interactive inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-surface text-foreground transition hover:border-border';

export const OVERLAY_ICON_BUTTON =
  'focus-ring-interactive inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-border/50 text-muted-foreground transition hover:border-accent/50 hover:text-accent';

export const OVERLAY_FOOTER =
  'border-t border-border/40 px-4 py-2 text-xxs text-subtle-foreground sm:text-xs';

export const SUGGESTION_CHIP =
  'focus-ring-interactive rounded-full border border-border/60 px-3 py-1.5 text-xs text-muted-foreground transition hover:border-accent hover:text-accent';

export const SUGGESTION_CHIP_ACCENT =
  'focus-ring-interactive inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent transition hover:bg-accent/15';

export const SECTION_LABEL =
  'px-1 text-xxs font-semibold uppercase tracking-label text-subtle-foreground';

export const RESULT_ROW_BASE =
  'flex items-center gap-3 rounded-lg px-3 py-2 transition-colors';

export const RESULT_ROW_ACTIVE = 'bg-accent/12 ring-1 ring-inset ring-accent/25';
export const RESULT_ROW_IDLE = 'hover:bg-surface-subtle';

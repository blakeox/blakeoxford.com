/**
 * Typed class recipes for shared UI primitives.
 *
 * CSS token values remain owned by src/styles/theme.css. This module owns
 * the public variant vocabulary and class composition so primitives do not
 * maintain separate, silently drifting maps.
 */
import { cn } from '@/utils/cn';

export const baseCardRecipe = {
  base: [
    'group relative flex flex-col',
    'focus-within:ring-2 focus-within:ring-accent/25 focus-within:ring-offset-2 focus-within:ring-offset-background',
    'focus-visible:outline-none',
    'transition-colors duration-normal motion-safe:transition-transform motion-safe:duration-normal',
    'supports-[backdrop-filter]:backdrop-saturate-150',
    'transform-gpu',
  ].join(' '),
  variants: {
    variant: {
      default: 'border border-border/30 bg-surface/95 shadow-sm',
      glass:
        'border border-border/40 bg-glass/85 shadow-md backdrop-blur supports-[backdrop-filter]:bg-glass/75',
      elevated: 'border border-border/30 bg-surface shadow-lg',
      subtle: 'border border-border/25 bg-surface-subtle/50 shadow-none',
    },
    hover: {
      none: '',
      lift: 'motion-safe:hover:-translate-y-1 hover:shadow-lg focus-within:shadow-lg',
      scale: 'motion-safe:hover:scale-[1.02] focus-within:scale-[1.01]',
    },
    rounded: {
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      '2xl': 'rounded-2xl',
    },
    padding: {
      none: 'p-0',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    },
  },
} as const;

export type BaseCardVariant = keyof typeof baseCardRecipe.variants.variant;
export type BaseCardHover = keyof typeof baseCardRecipe.variants.hover;
export type BaseCardRounded = keyof typeof baseCardRecipe.variants.rounded;
export type BaseCardPadding = keyof typeof baseCardRecipe.variants.padding;

export function getBaseCardClasses({
  variant = 'default',
  hover = 'none',
  rounded = '2xl',
  className = '',
}: {
  variant?: BaseCardVariant;
  hover?: BaseCardHover;
  rounded?: BaseCardRounded;
  className?: string;
}) {
  return cn(
    baseCardRecipe.base,
    baseCardRecipe.variants.variant[variant],
    baseCardRecipe.variants.hover[hover],
    baseCardRecipe.variants.rounded[rounded],
    className
  );
}

export function getBaseCardPadding(padding: BaseCardPadding) {
  return baseCardRecipe.variants.padding[padding];
}

export const buttonRecipe = {
  base: 'inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-[color,background-color,border-color,transform,box-shadow] duration-normal focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none',
  variants: {
    primary:
      'border border-button-primary-bg bg-button-primary-bg text-button-primary-fg hover:bg-button-primary-bg-hover hover:border-button-primary-border-hover focus-visible:ring-accent/60',
    secondary: 'border border-border bg-surface text-foreground hover:bg-surface-subtle',
    outline:
      'border border-foreground/30 bg-transparent text-foreground hover:border-accent hover:text-accent-emphasis focus-visible:ring-accent/60',
    ghost: 'border border-transparent bg-transparent text-foreground/85 hover:text-accent-emphasis',
    link: 'border border-transparent bg-transparent px-0 text-accent-emphasis hover:text-accent hover:underline',
  },
  sizes: {
    sm: 'min-h-[2.25rem] px-3.5 py-1.5 text-sm',
    md: 'min-h-[2.75rem] px-5 py-2.5 text-sm',
    lg: 'min-h-[3.25rem] px-6 py-3 text-base',
    icon: 'size-8 min-h-8 min-w-8 p-0',
  },
} as const;

export type ButtonVariant = keyof typeof buttonRecipe.variants;
export type ButtonSize = keyof typeof buttonRecipe.sizes;

export function getButtonClasses({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  className = '',
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}) {
  // Disabled/loading must exclude active variant color utilities — Tailwind
  // source order (not class-string order) wins, so appending disabled tokens
  // alongside primary/secondary colors leaves the active fill winning.
  const isInactive = disabled || loading;
  return cn(
    buttonRecipe.base,
    isInactive
      ? 'pointer-events-none cursor-not-allowed border border-button-disabled-border bg-button-disabled-bg text-button-disabled-fg'
      : buttonRecipe.variants[variant],
    variant === 'link' ? 'p-0 text-sm' : buttonRecipe.sizes[size],
    fullWidth && 'w-full',
    loading && 'aria-busy:cursor-wait',
    className
  );
}

export const fieldRecipe = {
  base: [
    'w-full rounded-xl border border-border bg-field-bg px-4 py-3.5 text-base text-foreground shadow-sm',
    'placeholder:text-subtle-foreground/80',
    'hover:border-accent/40 focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25',
    // Reuse button-disabled-* (dedicated state tokens — never opacity alone).
    'disabled:cursor-not-allowed disabled:border-button-disabled-border disabled:bg-button-disabled-bg disabled:text-button-disabled-fg',
    'aria-invalid:border-error aria-invalid:ring-2 aria-invalid:ring-error/25',
    'transition-[border-color,box-shadow,background-color]',
  ].join(' '),
  /** Focus-within wrapper for composers (Ask textarea, Find search). */
  shell: [
    'relative flex min-w-0 items-center gap-2 rounded-xl border border-border/55 bg-field-bg',
    'transition-[border-color,box-shadow] focus-within:border-accent/55 focus-within:ring-2 focus-within:ring-accent/25',
  ].join(' '),
} as const;

/** Shared inactive paint for DIY controls that are not Button/FormField. */
export const disabledControlClasses =
  'disabled:cursor-not-allowed disabled:border-button-disabled-border disabled:bg-button-disabled-bg disabled:text-button-disabled-fg';

export function getFieldClasses(className = '') {
  return cn(fieldRecipe.base, className);
}

export function getFieldShellClasses(className = '') {
  return cn(fieldRecipe.shell, className);
}

/**
 * Soft suggestion / session / action chips for islands.
 * Prefer Button for primary commits; chips are secondary density controls.
 */
export const chipRecipe = {
  base: 'focus-ring-interactive inline-flex items-center border transition',
  variants: {
    quiet: 'border-border/60 text-muted-foreground hover:border-accent hover:text-accent',
    accent: 'border-accent/30 bg-accent-subtle font-medium text-accent-emphasis hover:bg-accent/15',
  },
  sizes: {
    xs: 'gap-1 px-2 py-1 text-xxs',
    sm: 'gap-1.5 px-3 py-1.5 text-xs',
    md: 'gap-2 px-4 py-3 text-sm',
  },
  shapes: {
    soft: 'rounded-md',
    pill: 'rounded-full',
    panel: 'rounded-xl',
  },
  active: 'border-accent/40 bg-accent-subtle text-accent',
} as const;

export type ChipVariant = keyof typeof chipRecipe.variants;
export type ChipSize = keyof typeof chipRecipe.sizes;
export type ChipShape = keyof typeof chipRecipe.shapes;

export function getChipClasses({
  variant = 'quiet',
  size = 'sm',
  shape = 'pill',
  active = false,
  className = '',
}: {
  variant?: ChipVariant;
  size?: ChipSize;
  shape?: ChipShape;
  active?: boolean;
  className?: string;
} = {}) {
  return cn(
    chipRecipe.base,
    active ? chipRecipe.active : chipRecipe.variants[variant],
    chipRecipe.sizes[size],
    chipRecipe.shapes[shape],
    className
  );
}

export const badgeRecipe = {
  base: 'inline-flex items-center rounded-full',
  variants: {
    primary: 'bg-accent text-on-accent border border-accent/40 font-medium',
    secondary: 'bg-surface text-foreground border border-border/40 font-medium',
    outline: 'bg-transparent text-foreground border border-border/60 font-medium',
    subtle: 'bg-surface-subtle text-muted-foreground border border-border/25 font-medium',
    pill: 'bg-surface-subtle text-subtle-foreground ring-1 ring-border/40 border-0 font-semibold uppercase tracking-smallcaps',
    success: 'bg-success-subtle text-success-emphasis border border-success/30 font-medium',
    warning: 'bg-warning-subtle text-warning-emphasis border border-warning/30 font-medium',
    error: 'bg-error-subtle text-error-emphasis border border-error/30 font-medium',
  },
  sizes: {
    xs: {
      default: 'px-2 py-0.5 text-xxs',
      pill: 'gap-2 px-3 py-1 text-xxs',
    },
    sm: {
      default: 'px-2 py-1 text-xs',
      pill: 'gap-2 px-4 py-2 text-xs',
    },
    md: {
      default: 'px-3 py-1.5 text-sm',
      pill: 'gap-2 px-5 py-2 text-sm',
    },
  },
  dotSizes: {
    xs: 'h-1 w-1',
    sm: 'h-1.5 w-1.5',
    md: 'h-2 w-2',
  },
} as const;

export type BadgeVariant = keyof typeof badgeRecipe.variants;
export type BadgeSize = keyof typeof badgeRecipe.sizes;

export function getBadgeClasses({
  variant = 'secondary',
  size = 'sm',
  className = '',
}: {
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}) {
  const sizeClasses =
    variant === 'pill' ? badgeRecipe.sizes[size].pill : badgeRecipe.sizes[size].default;

  return cn(badgeRecipe.base, badgeRecipe.variants[variant], sizeClasses, className);
}

export const featureCardRecipe = {
  base: 'bg-gradient-to-br backdrop-blur-sm @container @md:p-10',
  variants: {
    accent: {
      surface: 'from-accent/10 to-accent/5 border-accent/30',
      text: 'text-accent-emphasis',
      badge: 'bg-accent text-on-accent',
    },
    primary: {
      surface: 'from-primary/10 to-primary/5 border-primary/30',
      text: 'text-primary-emphasis',
      badge: 'bg-primary text-on-primary',
    },
  },
} as const;

export type FeatureCardVariant = keyof typeof featureCardRecipe.variants;

/** Semantic aside for blog/docs — status tones live here, not on FeatureCard. */
export const calloutRecipe = {
  base: 'rounded-2xl border-l-4 p-6 shadow-sm @sm:p-8',
  variants: {
    info: {
      surface: 'border-info bg-info/10',
      text: 'text-info-emphasis',
    },
    accent: {
      surface: 'border-accent bg-accent-subtle',
      text: 'text-accent-emphasis',
    },
    success: {
      surface: 'border-success bg-success-subtle',
      text: 'text-success-emphasis',
    },
    warning: {
      surface: 'border-warning bg-warning-subtle',
      text: 'text-warning-emphasis',
    },
    error: {
      surface: 'border-error bg-error-subtle',
      text: 'text-error-emphasis',
    },
  },
} as const;

export type CalloutVariant = keyof typeof calloutRecipe.variants;

/** In-article section / statement band (not a marketing CtaBand). */
export const contentBandRecipe = {
  base: 'relative my-12 overflow-hidden rounded-2xl p-10 @md:p-12 @lg:p-16',
  variants: {
    subtle: 'border border-accent/20 bg-surface-subtle',
    surface: 'border border-border/40 bg-surface',
    accent: 'border border-accent/40 bg-accent text-on-accent',
  },
  align: {
    start: 'text-left',
    center: 'text-center',
  },
} as const;

export type ContentBandVariant = keyof typeof contentBandRecipe.variants;
export type ContentBandAlign = keyof typeof contentBandRecipe.align;

/** Numbered vertical step rail for blog implementation journeys. */
export const timelineRecipe = {
  base: 'relative my-16',
  connector: 'absolute bottom-0 left-6 top-0 hidden w-1 bg-accent-emphasis/20 md:block',
  list: 'space-y-12',
} as const;

export const timelineItemRecipe = {
  base: 'relative pl-0 md:pl-20',
  marker:
    'absolute left-0 top-0 hidden size-14 items-center justify-center rounded-full bg-accent text-xl font-bold text-on-accent shadow-lg md:flex',
  body: {
    accent: 'rounded-2xl border border-accent/30 bg-accent/5 p-8 shadow-lg @md:p-10',
    primary: 'rounded-2xl border border-primary/30 bg-surface-subtle p-8 shadow-lg @md:p-10',
  },
  title: {
    accent: 'text-accent-emphasis',
    primary: 'text-primary-emphasis',
  },
} as const;

export type TimelineItemVariant = keyof typeof timelineItemRecipe.body;

export const containerRecipe = {
  sizes: {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-none',
  },
} as const;

export type ContainerSize = keyof typeof containerRecipe.sizes;

export function getContainerClasses({
  size = 'lg',
  padding = true,
  center = true,
  className = '',
}: {
  size?: ContainerSize;
  padding?: boolean;
  center?: boolean;
  className?: string;
}) {
  return cn(
    center && 'mx-auto',
    'w-full',
    containerRecipe.sizes[size],
    padding && 'layout-gutter',
    className
  );
}

export const sectionRecipe = {
  padding: {
    none: '',
    sm: 'py-section-sm sm:py-section-md',
    md: 'py-section-md sm:py-section-lg',
    lg: 'py-section-lg sm:py-section-xl',
    xl: 'py-section-lg sm:py-section-xl lg:py-section-2xl',
  },
  background: {
    default: '',
    surface: 'bg-surface/50',
    gradient: 'bg-gradient-to-r from-background via-surface to-background',
    glass:
      'border border-border/40 bg-glass/85 shadow-md backdrop-blur supports-[backdrop-filter]:bg-glass/75',
  },
} as const;

export type SectionPadding = keyof typeof sectionRecipe.padding;
export type SectionBackground = keyof typeof sectionRecipe.background;

export function getSectionClasses({
  padding = 'lg',
  background = 'default',
  fullWidth = true,
  className = '',
}: {
  padding?: SectionPadding;
  background?: SectionBackground;
  fullWidth?: boolean;
  className?: string;
}) {
  return cn(
    sectionRecipe.padding[padding],
    sectionRecipe.background[background],
    fullWidth && 'w-full',
    className
  );
}

export const proseRecipe = {
  sizes: {
    base: 'prose',
    lg: 'prose prose-lg',
    xl: 'prose prose-lg lg:prose-xl',
  },
  base: [
    'max-w-none text-foreground',
    'prose-headings:font-heading prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground',
    'prose-h1:mb-8 prose-h1:text-5xl',
    'prose-h2:mt-16 prose-h2:mb-8 prose-h2:text-4xl',
    'prose-h3:mt-10 prose-h3:mb-5 prose-h3:text-3xl',
    'prose-p:mb-6 prose-p:text-lg prose-p:leading-relaxed prose-p:text-foreground/90',
    'prose-li:text-lg prose-li:leading-relaxed prose-li:text-foreground/90',
    'prose-a:text-accent-emphasis prose-a:no-underline hover:prose-a:underline',
    'prose-strong:font-semibold prose-strong:text-foreground',
    'prose-pre:bg-code-surface prose-pre:text-code-foreground',
  ].join(' '),
} as const;

export type ProseSize = keyof typeof proseRecipe.sizes;

export function getProseClasses(size: ProseSize = 'xl', className = '') {
  return cn(proseRecipe.sizes[size], proseRecipe.base, className);
}

/**
 * Cross-renderer surface contract for React and MDX-adjacent surfaces.
 *
 * These are class recipes, not components: Astro can continue using BaseCard while React/MDX
 * preserve their own semantic elements and runtime boundaries.
 */
export const crossRendererSurfaceRecipe = {
  interactive:
    'rounded-2xl border border-border/30 bg-surface/70 transition hover:border-accent/50 hover:bg-surface/90 focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none',
  editorial: 'rounded-2xl border border-border/40 bg-surface/70 shadow-sm',
  structural: 'rounded-xl border border-border bg-surface p-6',
} as const;

export type CrossRendererSurface = keyof typeof crossRendererSurfaceRecipe;

/** Ask message bubbles — assistant quiet surface vs user accent. */
export const messageBubbleRecipe = {
  base: 'max-w-[92%] px-3.5 py-2.5 text-sm',
  roles: {
    assistant:
      'rounded-2xl rounded-tl-md bg-surface-subtle/90 text-foreground ring-1 ring-border/30',
    user: 'rounded-2xl rounded-tr-md bg-accent text-on-accent shadow-sm shadow-accent/20',
  },
} as const;

export type MessageBubbleRole = keyof typeof messageBubbleRecipe.roles;

export function getMessageBubbleClasses(role: MessageBubbleRole, className = '') {
  return cn(messageBubbleRecipe.base, messageBubbleRecipe.roles[role], className);
}

/** Border-ring loading spinner shared by Find + Ask status chrome. */
export const spinnerRecipe = {
  base: 'shrink-0 animate-spin rounded-full border-2 border-accent/30 border-t-accent',
  sizes: {
    sm: 'size-3.5',
    md: 'size-5',
  },
} as const;

export type SpinnerSize = keyof typeof spinnerRecipe.sizes;

export function getSpinnerClasses(size: SpinnerSize = 'sm', className = '') {
  return cn(spinnerRecipe.base, spinnerRecipe.sizes[size], className);
}

/** Streaming / typing pulse dots. */
export const TYPING_DOT = 'size-1.5 animate-pulse rounded-full bg-accent/60';
export const STATUS_PULSE_DOT = 'size-1.5 animate-pulse rounded-full bg-accent';

/** Keyboard hint chrome shared by Nav, Find, and Ask footers. */
export const kbdRecipe = {
  base: 'rounded-md border border-border/70 bg-surface-subtle/90 px-1 py-0.5 font-mono text-xxs text-subtle-foreground',
} as const;

export function getKbdClasses(className = '') {
  return cn(kbdRecipe.base, className);
}

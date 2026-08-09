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
      '3xl': 'rounded-3xl',
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
  hover = 'lift',
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
  },
} as const;

export type ButtonVariant = keyof typeof buttonRecipe.variants;
export type ButtonSize = keyof typeof buttonRecipe.sizes;

export function getButtonClasses({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  className = '',
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return cn(
    buttonRecipe.base,
    buttonRecipe.variants[variant],
    variant === 'link' ? 'p-0 text-sm' : buttonRecipe.sizes[size],
    fullWidth && 'w-full',
    disabled && 'cursor-not-allowed opacity-50',
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

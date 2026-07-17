/**
 * Component Props Type Definitions
 * Consolidated prop interfaces for all components
 */

import type { CollectionEntry } from 'astro:content';
import type { ImageMetadata } from './index';

// ============================================================================
// Layout Component Props
// ============================================================================

/**
 * BaseLayout component props
 * Main layout wrapper for all pages
 */
export interface BaseLayoutProps {
  title?: string;
  description?: string;
  url?: string;
  wide?: boolean;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: string;
  noindex?: boolean;
}

/**
 * ProjectDetailLayout component props
 * Layout for individual project detail pages
 */
export interface ProjectDetailLayoutProps {
  project: CollectionEntry<'projects'>;
  title?: string;
  description?: string;
}

// ============================================================================
// Feature Component Props (Blog)
// ============================================================================

/**
 * BlogCard component props
 * Compact card for grid layouts
 */
export interface BlogCardProps {
  post: CollectionEntry<'blog'>;
  featured?: boolean;
  showImage?: boolean;
  showExcerpt?: boolean;
}

/**
 * BlogPostRow component props
 * Row layout for blog posts with image
 */
export interface BlogPostRowProps {
  post: CollectionEntry<'blog'>;
  align?: 'left' | 'right';
  featured?: boolean;
}

// ============================================================================
// Feature Component Props (Projects)
// ============================================================================

/**
 * ProjectCard component props
 * Card for displaying project information
 */
export interface ProjectCardProps {
  project: CollectionEntry<'projects'>;
  featured?: boolean;
  showImage?: boolean;
  showTags?: boolean;
}

// ============================================================================
// UI Component Props (Images)
// ============================================================================

/**
 * OptimizedImage component props
 * Handles image optimization and lazy loading
 */
export interface OptimizedImageProps {
  src: string | ImageMetadata;
  alt: string;
  width?: number;
  height?: number;
  class?: string;
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'sync' | 'auto';
  sizes?: string;
  quality?: number;
  format?: 'avif' | 'webp' | 'jpeg' | 'png';
}

/**
 * CoinFlipImage component props
 * Interactive image flipper with accessibility
 */
export interface CoinFlipImageProps {
  frontSrc: string | ImageMetadata;
  backSrc: string | ImageMetadata;
  alt: string;
  altBack: string;
  size?: number;
  flipMultipleTimes?: boolean;
  autoFlip?: boolean;
  flipDuration?: number;
}

// ============================================================================
// UI Component Props (Primitives)
// ============================================================================

/**
 * Badge component props
 */
export interface BadgeProps {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  pill?: boolean;
  class?: string;
}

/**
 * Button component props
 */
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  href?: string;
  type?: 'button' | 'submit' | 'reset';
  class?: string;
  target?: string;
  rel?: string;
}

/**
 * DateDisplay component props
 */
export interface DateDisplayProps {
  date: Date | string;
  format?: 'short' | 'long' | 'iso' | 'relative';
  showTime?: boolean;
  class?: string;
}

/**
 * Flex component props
 * Utility component for flexbox layouts
 */
export interface FlexProps {
  direction?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  gap?: number | string;
  wrap?: boolean;
  class?: string;
}

/**
 * GradientOverlay component props
 */
export interface GradientOverlayProps {
  variant?: 'default' | 'subtle' | 'strong' | 'hover-card';
  direction?: 'tl' | 'tr' | 'bl' | 'br';
  opacity?: number;
  class?: string;
}

// ============================================================================
// Icon Component Props
// ============================================================================

/**
 * Icon component props
 * Used across multiple feature components
 */
export interface IconProps {
  name: string;
  size?: number | string;
  class?: string;
  ariaLabel?: string;
}

/**
 * Social icon component props
 */
export interface SocialIconProps extends IconProps {
  platform: 'github' | 'linkedin' | 'twitter' | 'email' | 'microsoft-learn' | 'rss';
  href?: string;
}

// ============================================================================
// Navigation Component Props
// ============================================================================

/**
 * NavBar component props
 */
export interface NavBarProps {
  currentPath?: string;
  transparent?: boolean;
  fixed?: boolean;
}

/**
 * @deprecated Nav is Astro HTML + progressive enhancement; kept for type catalog compat.
 */
export interface NavBarIslandProps {
  currentPath?: string;
  links: Array<{ href: string; label: string }>;
  socialLinks?: Array<{ href: string; label: string; icon?: string }>;
}

// ============================================================================
// Technology Component Props
// ============================================================================

/**
 * Technology item for tech stack displays
 */
export interface TechnologyItem {
  name: string;
  img: string | ImageMetadata;
  alt: string;
  optimized?: boolean;
  href?: string;
  description?: string;
}

/**
 * TechnologyGrid component props
 */
export interface TechnologyGridProps {
  technologies: TechnologyItem[];
  columns?: number;
  showLabels?: boolean;
  class?: string;
}

// Components - Organized by feature and purpose
// This provides a clean API for importing components

// Layout Components
export * from './layout/index.js';

// UI Components  
export * from './ui/index.js';

// Feature Components
export * from './features/projects/index.js';
export * from './features/blog/index.js';
export * from './features/search/index.js';

// Common Components
export * from './common/index.js';

// Legacy exports for backwards compatibility (to be removed after migration)
export { default as NavBar } from './layout/NavBar.astro';
export { default as Footer } from './layout/Footer.astro';
export { default as SearchOverlay } from './features/search/SearchOverlay.astro';
export { default as ProjectCard } from './features/projects/ProjectCard.astro';
export { default as ProjectRow } from './features/projects/ProjectRow.astro';
export { default as ProjectHero } from './features/projects/ProjectHero.astro';
export { default as ProjectTags } from './features/projects/ProjectTags.astro';
export { default as BlogPostRow } from './features/blog/BlogPostRow.astro';
export { default as OptimizedImage } from './ui/OptimizedImage.astro';
export { default as CoinFlipImage } from './ui/CoinFlipImage.astro';
export { default as ThemeToggle } from './ui/ThemeToggle.jsx';
export { default as PhotoCarousel } from './ui/PhotoCarousel.astro';
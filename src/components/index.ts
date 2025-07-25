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
export { default as NavBar } from './NavBar.astro';
export { default as Footer } from './Footer.astro';
export { default as SearchOverlay } from './SearchOverlay.astro';
export { default as ProjectCard } from './ProjectCard.astro';
export { default as ProjectRow } from './ProjectRow.astro';
export { default as ProjectHero } from './ProjectHero.astro';
export { default as ProjectTags } from './ProjectTags.astro';
export { default as BlogPostRow } from './BlogPostRow.astro';
export { default as OptimizedImage } from './OptimizedImage.astro';
export { default as CoinFlipImage } from './CoinFlipImage.astro';
export { default as ThemeToggle } from './ThemeToggle.jsx';
export { default as PhotoCarousel } from './PhotoCarousel.astro';
export { default as AchievementCard } from './AchievementCard.astro';
export { default as MetricsTable } from './MetricsTable.astro';
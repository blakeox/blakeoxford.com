// Component Composition Patterns
// Provides semantic grouping of related components for better developer experience

// Layout Section Components
import NavBar from '../layout/NavBar.astro';
import Footer from '../layout/Footer.astro';

export const Layout = {
  NavBar,
  Footer
} as const;

// UI Components Collection
import OptimizedImage from '../ui/OptimizedImage.astro';
import CoinFlipImage from '../ui/CoinFlipImage.astro';
import PhotoCarousel from '../ui/PhotoCarousel.astro';

export const UI = {
  OptimizedImage,
  CoinFlipImage, 
  PhotoCarousel
} as const;

// Search Components
// Common Components
import AchievementCard from '../common/AchievementCard.astro';
import MetricsTable from '../common/MetricsTable.astro';

export const Common = {
  AchievementCard,
  MetricsTable
} as const;

// Type definitions for better TypeScript support
export type LayoutType = typeof Layout;
export type UIType = typeof UI;
export type CommonType = typeof Common;

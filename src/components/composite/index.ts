// Component Composition Patterns
// Provides semantic grouping of related components for better developer experience

// Project Section Components - grouped for easier usage
import ProjectCard from '../features/projects/ProjectCard.astro';
import ProjectRow from '../features/projects/ProjectRow.astro';
import ProjectHero from '../features/projects/ProjectHero.astro';
import ProjectTags from '../features/projects/ProjectTags.astro';

export const ProjectSection = {
  Card: ProjectCard,
  Row: ProjectRow,
  Hero: ProjectHero,
  Tags: ProjectTags
} as const;

// Blog Section Components
import BlogPostRow from '../features/blog/BlogPostRow.astro';

export const BlogSection = {
  PostRow: BlogPostRow
} as const;

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
import ThemeToggle from '../ui/ThemeToggle.jsx';
import PhotoCarousel from '../ui/PhotoCarousel.astro';

export const UI = {
  OptimizedImage,
  CoinFlipImage, 
  ThemeToggle,
  PhotoCarousel
} as const;

// Search Components
import SearchOverlay from '../features/search/SearchOverlay.astro';

export const Search = {
  Overlay: SearchOverlay
} as const;

// Common Components
import AchievementCard from '../common/AchievementCard.astro';
import MetricsTable from '../common/MetricsTable.astro';

export const Common = {
  AchievementCard,
  MetricsTable
} as const;

// Type definitions for better TypeScript support
export type ProjectSectionType = typeof ProjectSection;
export type BlogSectionType = typeof BlogSection;
export type LayoutType = typeof Layout;
export type UIType = typeof UI;
export type SearchType = typeof Search;
export type CommonType = typeof Common;

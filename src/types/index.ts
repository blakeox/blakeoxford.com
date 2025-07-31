// Core type definitions for the portfolio site

// Re-export all consolidated types from domain-specific files
export * from './core';
export * from './accessibility';
export * from './analytics';
export * from './dropdown';

export interface ProjectData {
  slug: string;
  data: {
    title: string;
    description: string;
    date: Date;
    tags: string[];
    image?: string;
    link?: string;
    draft: boolean;
  };
}

export interface BlogPost {
  slug: string;
  data: {
    title: string;
    description?: string;
    pubDate: Date;
    author?: string;
    tags?: string[];
    draft?: boolean;
  };
}

export interface TechnologyItem {
  name: string;
  img: string | any; // Can be imported image or string path
  alt: string;
  optimized?: boolean;
}

export interface NavLink {
  href: string;
  label: string;
  external?: boolean;
}

export interface SiteConfig {
  name: string;
  domain: string;
  author: string;
  description: string;
  tagline: string;
  email: string;
  social: {
    twitter: string;
    github: string;
    linkedin: string;
  };
}

// Component Props Types
export interface ProjectCardProps {
  project: ProjectData;
  featured?: boolean;
}

export interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  class?: string;
  loading?: 'lazy' | 'eager';
}

export interface CoinFlipImageProps {
  frontSrc: string;
  backSrc: string;
  alt: string;
  altBack: string;
  size?: number;
  flipMultipleTimes?: boolean;
}

// Layout Props
export interface BaseLayoutProps {
  title?: string;
  description?: string;
  url?: string;
  wide?: boolean;
  keywords?: string;
}
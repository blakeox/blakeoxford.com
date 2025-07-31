// Components - Organized by feature and purpose with dynamic loading support
// This provides a clean API for importing components

/**
 * STATIC IMPORTS - Critical components loaded immediately
 * These are essential components needed for initial page render
 */

// Layout Components (Critical - Always needed)
export * from './layout/index.js';

// Core UI Components (Critical - Above the fold)
export * from './ui/index.js';

/**
 * DYNAMIC LOADING EXPORTS - Non-critical components loaded on demand
 * These components are loaded dynamically to optimize initial bundle size
 */

// Dynamic component loader utilities
export const loadProjectComponents = () => import('./features/projects/index.js');
export const loadBlogComponents = () => import('./features/blog/index.js');
export const loadSearchComponents = () => import('./features/search/index.js');
export const loadCommonComponents = () => import('./common/index.js');

/**
 * COMPONENT COMPOSITION PATTERNS - Always available for better DX
 */
export * from './composite/index.js';

/**
 * LAZY LOADING HELPERS - Utilities for component-level lazy loading
 */

// Async component wrapper for lazy loading
export async function loadComponentAsync<T>(
  loader: () => Promise<{ [key: string]: T }>,
  componentName: string
): Promise<T | null> {
  try {
    const module = await loader();
    return module[componentName] || module.default || null;
  } catch (error) {
    console.error(`Failed to load component ${componentName}:`, error);
    return null;
  }
}

// Preload components for better UX
export function preloadComponents(loaders: Array<() => Promise<any>>): void {
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => {
      loaders.forEach(loader => {
        loader().catch(error => {
          console.warn('Component preload failed:', error);
        });
      });
    });
  } else {
    setTimeout(() => {
      loaders.forEach(loader => {
        loader().catch(error => {
          console.warn('Component preload failed:', error);
        });
      });
    }, 2000);
  }
}

// Setup intersection observer for visibility-based component loading
export function setupVisibilityBasedLoading(): void {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const componentType = entry.target.getAttribute('data-component-load');
        if (componentType) {
          switch (componentType) {
            case 'projects':
              loadProjectComponents();
              break;
            case 'blog':
              loadBlogComponents();
              break;
            case 'search':
              loadSearchComponents();
              break;
            case 'common':
              loadCommonComponents();
              break;
          }
          observer.unobserve(entry.target);
        }
      }
    });
  }, { rootMargin: '100px' });

  // Observe elements that should trigger component loading
  document.querySelectorAll('[data-component-load]').forEach(element => {
    observer.observe(element);
  });
}

// Auto-setup visibility-based loading
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupVisibilityBasedLoading);
  } else {
    setupVisibilityBasedLoading();
  }
}
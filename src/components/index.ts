// Components - Organized by feature and purpose with modern direct imports
// Expose only the pieces we actively consume in Astro templates

// Layout & shared UI
export * from './layout/index.js';
export * from './ui/index.js';

// Composite patterns (pre-composed bundles of components)
export * from './composites/index.js';
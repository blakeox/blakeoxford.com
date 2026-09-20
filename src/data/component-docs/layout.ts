/**
 * Layout component documentation
 */

import type { ComponentDoc } from './types';

export const layoutDocs: ComponentDoc[] = [
  {
    name: 'NavBar',
    category: 'Layout',
    description:
      'Site chrome navigation as Astro HTML with progressive enhancement (theme, mobile menu, scroll). Does not depend on React hydration.',
    filePath: 'src/components/layout/NavBar.astro',
    examples: [
      {
        title: 'Default navigation',
        code: '<NavBar />',
      },
    ],
    accessibility: [
      'Semantic nav element',
      'Mobile menu with ARIA attributes',
      'Keyboard navigation (Tab, Enter, Escape)',
      'Focus trap in mobile drawer with return focus to burger',
      'Auto-hide on scroll down (all viewports); blocked when menu or Command Center is open',
      'Screen reader status announcements via aria-live',
    ],
    tags: ['navigation', 'layout', 'mobile-menu', 'responsive'],
    visualTier: 'quiet',
    tokenDependencies: [
      '--color-surface',
      '--color-border',
      '--color-accent',
      '--color-foreground',
    ],
    visualBaseline: 'navbar',
  },
  {
    name: 'Footer',
    category: 'Layout',
    description:
      'Site close: page links and elsewhere from nav.json, copyright, and back to top. No section headings.',
    filePath: 'src/components/layout/Footer.astro',
    examples: [
      {
        title: 'Site footer',
        code: '<Footer />',
      },
    ],
    accessibility: [
      'role="contentinfo" landmark',
      'aria-label for footer region',
      'role="navigation" for page links',
      'Social links use visible text labels',
    ],
    tags: ['footer', 'navigation', 'social-links', 'layout'],
    visualTier: 'quiet',
    tokenDependencies: ['--color-surface', '--color-border', '--color-muted-foreground'],
    visualBaseline: 'footer',
  },
];

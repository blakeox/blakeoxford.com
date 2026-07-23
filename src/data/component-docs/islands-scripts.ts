/**
 * Script / enhancement island documentation
 */

import type { ComponentDoc } from './types';

export const islandScriptDocs: ComponentDoc[] = [
  {
    name: 'Nav enhancement scripts',
    category: 'Islands',
    description:
      'Vanilla progressive enhancement for the Astro NavBar (theme, mobile menu, scroll, search).',
    filePath: 'src/scripts/features/ModernNavBar.ts',
    examples: [
      {
        title: 'Boot from NavBar.astro',
        code: "import { initModernNavBar } from '@/scripts/features/ModernNavBar';\ninitModernNavBar();",
      },
    ],
    accessibility: [
      'Semantic nav element (in Astro markup)',
      'Mobile menu with ARIA attributes',
      'Keyboard navigation (Tab, Enter, Escape)',
      'Focus management for menu toggle',
      'Screen reader announcements',
    ],
    tags: ['navigation', 'progressive-enhancement'],
    visualTier: 'quiet',
    tokenDependencies: ['--color-surface', '--color-border', '--color-accent', '--nav-height'],
  },
  {
    name: 'Theme FOUC script',
    category: 'Islands',
    description:
      'Inline FOUC-prevention script from getThemeFoucPreventionScript() in BaseLayout (not a React island).',
    filePath: 'src/lib/theme.ts',
    examples: [
      {
        title: 'Theme init',
        code: '<script is:inline set:html={getThemeFoucPreventionScript()} />',
      },
    ],
    tags: ['theme', 'inline-script'],
    visualTier: 'quiet',
    tokenDependencies: ['--color-background', '--color-foreground'],
  },
];

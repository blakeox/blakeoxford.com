/**
 * Playwright visual snapshot registry — single source of truth for component baselines.
 * Referenced by componentDocs.ts and tests/playwright/visual/component-visual.spec.ts.
 */

export type ComponentVisualBaselineKey = 'navbar' | 'footer' | 'searchOverlay';

export type ComponentVisualBaseline = {
  key: ComponentVisualBaselineKey;
  route: string;
  selector: string;
  description: string;
  snapshotFile: string;
  /** Playwright grep tag for the spec file */
  tags: readonly string[];
};

export const componentVisualBaselines: Record<ComponentVisualBaselineKey, ComponentVisualBaseline> = {
  navbar: {
    key: 'navbar',
    route: '/',
    selector: 'header nav#navbar, header nav[aria-label="Main navigation"], header nav',
    description: 'Main site navigation (desktop layout)',
    snapshotFile: 'navbar.png',
    tags: ['@visual-essential', '@visual-components'],
  },
  footer: {
    key: 'footer',
    route: '/',
    selector: 'footer',
    description: 'Site footer with links and social icons',
    snapshotFile: 'footer.png',
    tags: ['@visual-essential', '@visual-components'],
  },
  searchOverlay: {
    key: 'searchOverlay',
    route: '/',
    selector: '#search-overlay',
    description: 'Search overlay open state',
    snapshotFile: 'searchOverlay.png',
    tags: ['@visual-essential', '@visual-components'],
  },
};

export function getVisualBaseline(key: ComponentVisualBaselineKey): ComponentVisualBaseline {
  return componentVisualBaselines[key];
}

export function getAllVisualBaselines(): ComponentVisualBaseline[] {
  return Object.values(componentVisualBaselines);
}

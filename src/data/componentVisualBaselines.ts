/**
 * Playwright visual snapshot registry — single source of truth for component baselines.
 * Referenced by componentDocs.ts and tests/playwright/visual/component-visual.spec.ts.
 */

export type CommandCenterVisualSetup = 'browse' | 'results' | 'ask' | 'empty';

export type ComponentVisualBaselineKey =
  | 'navbar'
  | 'footer'
  | 'searchOverlay'
  | 'commandCenterResults'
  | 'commandCenterAsk'
  | 'commandCenterEmpty';

export type ComponentVisualBaseline = {
  key: ComponentVisualBaselineKey;
  route: string;
  selector: string;
  description: string;
  snapshotFile: string;
  /** Playwright grep tag for the spec file */
  tags: readonly string[];
  /** Optional Command Center state to capture */
  commandCenterSetup?: CommandCenterVisualSetup;
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
    selector: '#search-overlay [data-panel]',
    description: 'Command Center browse state (open, no query)',
    snapshotFile: 'searchOverlay.png',
    tags: ['@visual-essential', '@visual-components'],
    commandCenterSetup: 'browse',
  },
  commandCenterResults: {
    key: 'commandCenterResults',
    route: '/',
    selector: '#search-overlay [data-panel]',
    description: 'Command Center with search results',
    snapshotFile: 'commandCenterResults.png',
    tags: ['@visual-essential', '@visual-components'],
    commandCenterSetup: 'results',
  },
  commandCenterAsk: {
    key: 'commandCenterAsk',
    route: '/',
    selector: '#search-overlay [data-panel]',
    description: 'Command Center Ask AI mode',
    snapshotFile: 'commandCenterAsk.png',
    tags: ['@visual-essential', '@visual-components'],
    commandCenterSetup: 'ask',
  },
  commandCenterEmpty: {
    key: 'commandCenterEmpty',
    route: '/',
    selector: '#search-overlay [data-panel]',
    description: 'Command Center empty results state',
    snapshotFile: 'commandCenterEmpty.png',
    tags: ['@visual-essential', '@visual-components'],
    commandCenterSetup: 'empty',
  },
};

export function getVisualBaseline(key: ComponentVisualBaselineKey): ComponentVisualBaseline {
  return componentVisualBaselines[key];
}

export function getAllVisualBaselines(): ComponentVisualBaseline[] {
  return Object.values(componentVisualBaselines);
}

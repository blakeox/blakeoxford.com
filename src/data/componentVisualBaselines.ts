/**
 * Playwright visual snapshot registry — single source of truth for component baselines.
 * Referenced by componentDocs.ts and tests/playwright/visual/component-visual.spec.ts.
 */

export type CommandCenterVisualSetup = 'browse' | 'results' | 'empty';

export type NavVisualSetup = 'scrolled' | 'autoHidden';

export type ComponentVisualBaselineKey =
  | 'navbar'
  | 'navbarMobileClosed'
  | 'navbarMobileOpen'
  | 'navbarScrolled'
  | 'navbarAutoHidden'
  | 'navbarMobileAutoHidden'
  | 'footer'
  | 'searchOverlay'
  | 'commandCenterResults'
  | 'commandCenterEmpty'
  | 'chatDock';

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
  /** Override default desktop viewport (1280×800) */
  viewport?: { width: number; height: number };
  /** Open the mobile nav drawer before capture */
  openMobileMenu?: boolean;
  /** Scroll the page before capture */
  navSetup?: NavVisualSetup;
  /** Viewport clip for off-screen states (e.g. auto-hidden header) */
  screenshotClip?: { x: number; y: number; width: number; height: number };
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
  navbarMobileClosed: {
    key: 'navbarMobileClosed',
    route: '/',
    selector: 'header .nav-shell',
    description: 'Mobile navigation bar (drawer closed)',
    snapshotFile: 'navbarMobileClosed.png',
    tags: ['@visual-essential', '@visual-components'],
    viewport: { width: 390, height: 844 },
  },
  navbarMobileOpen: {
    key: 'navbarMobileOpen',
    route: '/',
    selector: 'header .nav-shell',
    description: 'Mobile navigation with drawer and backdrop open',
    snapshotFile: 'navbarMobileOpen.png',
    tags: ['@visual-essential', '@visual-components'],
    viewport: { width: 390, height: 844 },
    openMobileMenu: true,
  },
  navbarScrolled: {
    key: 'navbarScrolled',
    route: '/',
    selector: 'header .nav-shell',
    description: 'Desktop navigation after scroll (compact header)',
    snapshotFile: 'navbarScrolled.png',
    tags: ['@visual-essential', '@visual-components'],
    navSetup: 'scrolled',
  },
  navbarAutoHidden: {
    key: 'navbarAutoHidden',
    route: '/',
    selector: 'header .nav-shell',
    description: 'Desktop navigation tucked away after scrolling down',
    snapshotFile: 'navbarAutoHidden.png',
    tags: ['@visual-essential', '@visual-components'],
    navSetup: 'autoHidden',
    screenshotClip: { x: 0, y: 0, width: 1280, height: 88 },
  },
  navbarMobileAutoHidden: {
    key: 'navbarMobileAutoHidden',
    route: '/',
    selector: 'header .nav-shell',
    description: 'Mobile navigation tucked away after scrolling down',
    snapshotFile: 'navbarMobileAutoHidden.png',
    tags: ['@visual-essential', '@visual-components'],
    viewport: { width: 390, height: 844 },
    navSetup: 'autoHidden',
    screenshotClip: { x: 0, y: 0, width: 390, height: 88 },
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
    description: 'Site search with results',
    snapshotFile: 'commandCenterResults.png',
    tags: ['@visual-essential', '@visual-components'],
    commandCenterSetup: 'results',
  },
  commandCenterEmpty: {
    key: 'commandCenterEmpty',
    route: '/',
    selector: '#search-overlay [data-panel]',
    description: 'Site search empty results state',
    snapshotFile: 'commandCenterEmpty.png',
    tags: ['@visual-essential', '@visual-components'],
    commandCenterSetup: 'empty',
  },
  chatDock: {
    key: 'chatDock',
    route: '/',
    selector: '[data-ai-chat-panel]',
    description: 'Corner Ask companion dock (open, empty)',
    snapshotFile: 'chatDock.png',
    tags: ['@visual-essential', '@visual-components'],
  },
};

export function getVisualBaseline(key: ComponentVisualBaselineKey): ComponentVisualBaseline {
  return componentVisualBaselines[key];
}

export function getAllVisualBaselines(): ComponentVisualBaseline[] {
  return Object.values(componentVisualBaselines);
}

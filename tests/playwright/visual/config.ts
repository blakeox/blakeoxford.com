// Centralized configuration for visual snapshot tolerances and masks.
// This file is Playwright-agnostic to allow simple unit testing.

export type DiffCfg = { maxDiffPixelRatio?: number; maxDiffPixels?: number };
export type RouteCfg = { mask?: string[]; diff?: DiffCfg; fullPage?: boolean };

export const VISUAL_ROUTE_CONFIG: Record<string, RouteCfg> = {
  '/': { diff: { maxDiffPixelRatio: 0.01 } },
  '/projects/': { diff: { maxDiffPixelRatio: 0.01 } },
  '/about/': { mask: ['.photo-carousel'], diff: { maxDiffPixelRatio: 0.025 } },
  '/contact/': {
    mask: ['#hero .absolute', '#contact-info .absolute', '.coin-flip'],
    diff: { maxDiffPixelRatio: 0.02 },
    fullPage: false,
  },
};

// Guardrails for acceptable tolerance ranges
export const MAX_ALLOWED_TOLERANCE = 0.03; // do not exceed 3%

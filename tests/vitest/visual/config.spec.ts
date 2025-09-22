import { describe, it, expect } from 'vitest';
import { VISUAL_ROUTE_CONFIG, MAX_ALLOWED_TOLERANCE } from '../../playwright/visual/config';

const routes = ['/', '/about/', '/projects/', '/blog/', '/contact/'];

describe('Visual Route Config', () => {
  it('defines config for core routes', () => {
    for (const r of routes) {
      expect(VISUAL_ROUTE_CONFIG[r]).toBeDefined();
    }
  });

  it('uses reasonable default tolerances', () => {
    const homeTol = VISUAL_ROUTE_CONFIG['/']?.diff?.maxDiffPixelRatio ?? 0;
    expect(homeTol).toBeGreaterThan(0);
    expect(homeTol).toBeLessThanOrEqual(0.02);
  });

  it('does not exceed max allowed tolerance', () => {
    for (const r of routes) {
      const tol = VISUAL_ROUTE_CONFIG[r]?.diff?.maxDiffPixelRatio ?? 0;
      expect(tol).toBeLessThanOrEqual(MAX_ALLOWED_TOLERANCE);
    }
  });

  it('contact masks include decorative elements', () => {
    const masks = VISUAL_ROUTE_CONFIG['/contact/']?.mask || [];
    expect(masks).toContain('#hero .absolute');
    expect(masks.some((m) => m.includes('coin'))).toBe(true);
  });
});

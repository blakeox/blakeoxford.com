import { describe, it, expect } from 'vitest';
import { VISUAL_ROUTE_CONFIG, MAX_ALLOWED_TOLERANCE } from '../../playwright/visual/config';

describe('visual route config', () => {
  it('defines core routes with sane defaults', () => {
    const routes = Object.keys(VISUAL_ROUTE_CONFIG);
    // Core routes present
    for (const r of ['/', '/about/', '/projects/', '/blog/', '/contact/']) {
      expect(routes).toContain(r);
    }
  });

  it('keeps tolerances within the global guardrail', () => {
    for (const [, cfg] of Object.entries(VISUAL_ROUTE_CONFIG)) {
      const ratio = cfg.diff?.maxDiffPixelRatio ?? 0;
      expect(ratio).toBeLessThanOrEqual(MAX_ALLOWED_TOLERANCE);
    }
  });

  it('contact has viewport-only capture and masks', () => {
    const contact = VISUAL_ROUTE_CONFIG['/contact/'];
    expect(contact).toBeTruthy();
    expect(contact.fullPage).toBe(false);
    expect(contact.mask?.length).toBeGreaterThanOrEqual(1);
  });
});

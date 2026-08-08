import { describe, expect, it } from 'vitest';

import {
  componentVariantMatrix,
  getVisualVariantCases,
} from '../../src/data/design-system/variantMatrix';

describe('generated component variant matrix', () => {
  it('generates bounded unique cases from manifest recipe references', () => {
    const ids = componentVariantMatrix.map((entry) => entry.id);

    expect(ids.length).toBeGreaterThan(20);
    expect(new Set(ids).size).toBe(ids.length);
    expect(componentVariantMatrix.length).toBeLessThan(80);
  });

  it('covers every case across the required theme and viewport dimensions', () => {
    for (const entry of componentVariantMatrix) {
      expect(entry.themes).toEqual(['light', 'dark']);
      expect(entry.viewports).toEqual(['desktop', 'mobile']);
      expect(entry.variant.length, entry.id).toBeGreaterThan(0);

      if (entry.coverage === 'visual') {
        expect(entry.visualSurface, entry.id).toBe('/design/components/');
      } else {
        expect(entry.visualSurface, entry.id).toBeUndefined();
      }
    }
  });

  it('keeps visual coverage explicit and bounded', () => {
    const visualCases = getVisualVariantCases();

    expect(visualCases.length).toBeGreaterThan(10);
    expect(visualCases.length).toBeLessThan(45);
    expect(new Set(visualCases.map((entry) => entry.component))).toEqual(
      new Set(['BaseCard', 'Badge', 'Button', 'FeatureCard', 'Section'])
    );
  });
});

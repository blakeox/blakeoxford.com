import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  componentDocs,
  COMPONENT_AUTHORING_CHECKLIST,
  PRIMITIVE_PROP_CONTRACT,
} from '../../src/data/componentDocs';
import { componentVisualBaselines } from '../../src/data/componentVisualBaselines';
import {
  badgeRecipe,
  baseCardRecipe,
  buttonRecipe,
  containerRecipe,
  featureCardRecipe,
  proseRecipe,
  sectionRecipe,
} from '../../src/lib/design-system/recipes';
import {
  componentManifest,
  componentManifestBaselineKeys,
} from '../../src/data/component-docs/manifest';

const root = resolve(__dirname, '../..');

function expectedCategory(filePath: string) {
  if (filePath.startsWith('src/components/layout/')) return 'Layout';
  if (filePath.startsWith('src/components/features/')) return 'Features';
  if (filePath.startsWith('src/features/chat/')) return 'Islands';
  if (filePath.startsWith('src/features/contact/')) return 'Islands';
  if (filePath.startsWith('src/features/command-center/')) return 'Islands';
  if (filePath.startsWith('src/features/overlay/')) return 'Islands';
  if (filePath.startsWith('src/components/primitives/')) return 'Primitives';
  if (filePath.startsWith('src/components/composites/')) return 'Composites';
  // Progressive-enhancement scripts and theme helpers live alongside islands docs
  if (filePath.startsWith('src/scripts/features/')) return 'Islands';
  if (filePath === 'src/lib/theme.ts') return 'Islands';
  return null;
}

describe('component documentation catalog', () => {
  it('uses the typed manifest as the catalog source', () => {
    expect(componentDocs).toBe(componentManifest);
    expect(componentManifest.length).toBeGreaterThan(0);
  });

  it('points every documented component at an existing canonical file', () => {
    for (const doc of componentDocs) {
      const expected = expectedCategory(doc.filePath);

      expect(expected, `${doc.name} uses non-canonical path ${doc.filePath}`).not.toBeNull();
      expect(doc.category, `${doc.name} category should match ${doc.filePath}`).toBe(expected);
      expect(existsSync(resolve(root, doc.filePath)), `${doc.name} file is missing`).toBe(true);
    }
  });

  it('keeps component names unique', () => {
    const names = componentDocs.map((doc) => doc.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('keeps component root limited to the public barrel', () => {
    const files = readdirSync(resolve(root, 'src/components'), { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name);

    expect(files).toEqual(['index.ts']);
  });

  it('links visualBaseline keys to the shared Playwright registry', () => {
    for (const doc of componentManifest) {
      if (!doc.visualBaseline) continue;
      expect(
        componentManifestBaselineKeys.has(doc.visualBaseline),
        `${doc.name} references unknown baseline ${doc.visualBaseline}`
      ).toBe(true);
      expect(componentVisualBaselines[doc.visualBaseline]).toBeDefined();
    }
  });

  it('keeps manifest recipe references aligned with the typed recipes', () => {
    const recipeKeys = {
      baseCardRecipe: Object.keys(baseCardRecipe.variants.variant),
      'baseCardRecipe.hover': Object.keys(baseCardRecipe.variants.hover),
      'baseCardRecipe.padding': Object.keys(baseCardRecipe.variants.padding),
      'badgeRecipe.variant': Object.keys(badgeRecipe.variants),
      'badgeRecipe.size': Object.keys(badgeRecipe.sizes),
      'buttonRecipe.variant': Object.keys(buttonRecipe.variants),
      'buttonRecipe.size': Object.keys(buttonRecipe.sizes),
      'containerRecipe.size': Object.keys(containerRecipe.sizes),
      'featureCardRecipe.variant': Object.keys(featureCardRecipe.variants),
      'proseRecipe.size': Object.keys(proseRecipe.sizes),
      'sectionRecipe.padding': Object.keys(sectionRecipe.padding),
      'sectionRecipe.background': Object.keys(sectionRecipe.background),
    };

    for (const doc of componentManifest) {
      for (const reference of doc.recipeReferences ?? []) {
        expect(reference.keys).toEqual(recipeKeys[reference.recipe]);
      }
      expect(doc.accessibilityRequirements).toEqual(doc.accessibility ?? []);
    }
  });

  it('keeps manifest metadata free of duplicated CSS values', () => {
    const manifestSource = readFileSync(
      resolve(root, 'src/data/component-docs/manifest.ts'),
      'utf-8'
    );

    expect(manifestSource).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(manifestSource).not.toMatch(/\b(?:bg|text|border|shadow)-[a-z0-9-]+/);
  });

  it('documents BaseCard with visual tiers and token dependencies', () => {
    const baseCard = componentDocs.find((doc) => doc.name === 'BaseCard');

    expect(baseCard?.visualTier).toBe('elevated');
    expect(baseCard?.tokenDependencies?.length).toBeGreaterThan(0);
    expect(baseCard?.props?.some((prop) => prop.name === 'variant')).toBe(true);
  });

  it('keeps FeatureCard variants expressive rather than status-semantic', () => {
    const featureCard = componentDocs.find((doc) => doc.name === 'FeatureCard');
    const featureCardSource = readFileSync(
      resolve(root, 'src/components/composites/FeatureCard.astro'),
      'utf-8'
    );
    const variantProp = featureCard?.props?.find((prop) => prop.name === 'variant');

    expect(variantProp?.type).toBe("'accent' | 'primary'");
    expect(Object.keys(featureCardRecipe.variants)).toEqual(['accent', 'primary']);
    expect(featureCardSource).not.toMatch(/success|warning|info|error/);
  });

  it('keeps design documentation surfaces on the canonical BaseCard primitive', () => {
    const docs = [
      'src/pages/design/animations.astro',
      'src/pages/design/components.astro',
      'src/pages/design/patterns.astro',
      'src/components/features/design/ComponentCatalog.astro',
    ];

    for (const file of docs) {
      const source = readFileSync(resolve(root, file), 'utf-8');

      expect(source, `${file} should compose BaseCard`).toContain('BaseCard');
      expect(source, `${file} should not recreate card shells`).not.toMatch(
        /<(?:article|section|footer)[^>]*rounded-2xl[^>]*bg-surface/
      );
    }
  });

  it('exports authoring checklist and primitive prop contract', () => {
    expect(COMPONENT_AUTHORING_CHECKLIST.length).toBeGreaterThanOrEqual(5);
    expect(PRIMITIVE_PROP_CONTRACT.map((entry) => entry.prop)).toContain('data-testid');
  });
});

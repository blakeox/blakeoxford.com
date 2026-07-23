import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  componentDocs,
  COMPONENT_AUTHORING_CHECKLIST,
  PRIMITIVE_PROP_CONTRACT,
} from '../../src/data/componentDocs';
import { componentVisualBaselines } from '../../src/data/componentVisualBaselines';

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
    for (const doc of componentDocs) {
      if (!doc.visualBaseline) continue;
      expect(
        componentVisualBaselines[doc.visualBaseline],
        `${doc.name} references unknown baseline ${doc.visualBaseline}`
      ).toBeDefined();
    }
  });

  it('documents BaseCard with visual tiers and token dependencies', () => {
    const baseCard = componentDocs.find((doc) => doc.name === 'BaseCard');

    expect(baseCard?.visualTier).toBe('elevated');
    expect(baseCard?.tokenDependencies?.length).toBeGreaterThan(0);
    expect(baseCard?.props?.some((prop) => prop.name === 'variant')).toBe(true);
  });

  it('exports authoring checklist and primitive prop contract', () => {
    expect(COMPONENT_AUTHORING_CHECKLIST.length).toBeGreaterThanOrEqual(5);
    expect(PRIMITIVE_PROP_CONTRACT.map((entry) => entry.prop)).toContain('data-testid');
  });
});

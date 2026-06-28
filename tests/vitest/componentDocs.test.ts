import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { componentDocs } from '../../src/data/componentDocs';

const root = resolve(__dirname, '../..');

function expectedCategory(filePath: string) {
  if (filePath.startsWith('src/components/layout/')) return 'Layout';
  if (filePath.startsWith('src/components/features/')) return 'Features';
  if (filePath.startsWith('src/components/islands/')) return 'Islands';
  if (filePath.startsWith('src/components/primitives/')) return 'Primitives';
  if (filePath.startsWith('src/components/composites/')) return 'Composites';
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
});

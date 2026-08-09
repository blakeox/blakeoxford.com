import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { crossRendererSurfaceRecipe } from '../../src/lib/design-system/recipes';

const root = resolve(__dirname, '../..');

describe('cross-renderer surface contract', () => {
  it('uses semantic tokens and keeps the contract dependency-free', () => {
    for (const classes of Object.values(crossRendererSurfaceRecipe)) {
      expect(classes).toMatch(/border-border|bg-surface/);
      expect(classes).not.toMatch(/#[0-9a-f]{3,8}\b/i);
      expect(classes).not.toMatch(
        /\b(?:bg|text|border)-(?:gray|green|red|blue|yellow|white|black)-/
      );
    }
  });

  it('is consumed by the React and Astro surfaces without replacing their semantics', () => {
    const guidedPrompts = readFileSync(
      resolve(root, 'src/features/chat/components/ChatGuidedPrompts.tsx'),
      'utf-8'
    );
    const shortcuts = readFileSync(
      resolve(root, 'src/pages/accessibility/keyboard-shortcuts.astro'),
      'utf-8'
    );

    expect(guidedPrompts).toContain('crossRendererSurfaceRecipe.interactive');
    expect(guidedPrompts).toContain('<button');
    expect(shortcuts).toContain('crossRendererSurfaceRecipe.structural');
    expect(shortcuts).toContain('<kbd');
    expect(shortcuts).toContain('<div class="grid gap-4">');
  });

  it('keeps editorial MDX cards on FeatureCard and list structures structural', () => {
    const legalMdx = readFileSync(
      resolve(root, 'src/content/blog/combating-legal-ai-hallucinations.mdx'),
      'utf-8'
    );
    const ethicsMdx = readFileSync(
      resolve(root, 'src/content/blog/ethics-in-the-ai-age-semcacfe.mdx'),
      'utf-8'
    );

    expect(legalMdx).toContain('import FeatureCard');
    expect(legalMdx).not.toMatch(/<div[^>]*rounded-(?:xl|2xl)[^>]*bg-surface/);
    expect(ethicsMdx).toContain('<ol');
    expect(ethicsMdx).not.toContain('<FeatureCard variant="success"');
  });
});

/**
 * Primitive Components Test Suite
 * Tests for Badge, Button, Flex, and other primitive components
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getButtonClasses, getContainerClasses } from '../../src/lib/design-system/recipes';

describe('Badge Component', () => {
  let fileContent: string;

  beforeAll(() => {
    const filePath = resolve(__dirname, '../../src/components/primitives/Badge.astro');
    fileContent = readFileSync(filePath, 'utf-8');
  });

  it('should exist and be readable', () => {
    expect(fileContent).toBeDefined();
    expect(fileContent.length).toBeGreaterThan(0);
  });

  it('should have semantic span element', () => {
    expect(fileContent).toContain('<span');
  });

  it('should accept variant prop', () => {
    expect(fileContent).toContain('variant');
  });

  it('should have default styling classes', () => {
    expect(fileContent).toMatch(/class=/);
  });

  it('should support size variants', () => {
    expect(fileContent).toMatch(/size|sm:|md:|lg:/);
  });
});

describe('Button Component', () => {
  let fileContent: string;

  beforeAll(() => {
    const filePath = resolve(__dirname, '../../src/components/primitives/Button.astro');
    fileContent = readFileSync(filePath, 'utf-8');
  });

  it('should exist and be readable', () => {
    expect(fileContent).toBeDefined();
    expect(fileContent.length).toBeGreaterThan(0);
  });

  it('should support variant prop', () => {
    expect(fileContent).toContain('variant');
  });

  it('should have interactive states', () => {
    expect(getButtonClasses({ variant: 'primary' })).toContain('hover:');
  });

  it('should support disabled state', () => {
    expect(fileContent).toMatch(/disabled/);
  });

  it('should have focus-visible styles', () => {
    expect(getButtonClasses({ variant: 'primary' })).toContain('focus-visible:');
  });

  it('should support href prop for link buttons', () => {
    expect(fileContent).toContain('href');
  });
});

describe('Flex Component', () => {
  let fileContent: string;

  beforeAll(() => {
    const filePath = resolve(__dirname, '../../src/components/primitives/Flex.astro');
    fileContent = readFileSync(filePath, 'utf-8');
  });

  it('should exist and be readable', () => {
    expect(fileContent).toBeDefined();
    expect(fileContent.length).toBeGreaterThan(0);
  });

  it('should use flexbox display', () => {
    expect(fileContent).toContain('flex');
  });

  it('should support direction prop', () => {
    expect(fileContent).toMatch(/direction|flex-col|flex-row/);
  });

  it('should support align prop', () => {
    expect(fileContent).toMatch(/align|items-/);
  });

  it('should support justify prop', () => {
    expect(fileContent).toMatch(/justify|justify-/);
  });

  it('should support gap prop', () => {
    expect(fileContent).toMatch(/gap/);
  });

  it('should support wrap prop', () => {
    expect(fileContent).toMatch(/wrap|flex-wrap/);
  });
});

describe('Container Component', () => {
  let fileContent: string;

  beforeAll(() => {
    const filePath = resolve(__dirname, '../../src/components/primitives/Container.astro');
    fileContent = readFileSync(filePath, 'utf-8');
  });

  it('should exist and be readable', () => {
    expect(fileContent).toBeDefined();
    expect(fileContent.length).toBeGreaterThan(0);
  });

  it('should have max-width constraint', () => {
    expect(getContainerClasses({ size: 'lg' })).toContain('max-w-6xl');
  });

  it('should use tokenized layout gutter padding', () => {
    expect(fileContent).toContain('layout-gutter');
  });

  it('should center content', () => {
    expect(getContainerClasses({ center: true })).toContain('mx-auto');
  });

  it('should support slot for children', () => {
    expect(fileContent).toContain('<slot');
  });
});

describe('Grid Component', () => {
  let fileContent: string;

  beforeAll(() => {
    const filePath = resolve(__dirname, '../../src/components/primitives/Grid.astro');
    fileContent = readFileSync(filePath, 'utf-8');
  });

  it('should exist and be readable', () => {
    expect(fileContent).toBeDefined();
    expect(fileContent.length).toBeGreaterThan(0);
  });

  it('should use CSS grid display', () => {
    expect(fileContent).toContain('grid');
  });

  it('should support columns prop', () => {
    expect(fileContent).toMatch(/cols|grid-cols/);
  });

  it('should support gap prop', () => {
    expect(fileContent).toMatch(/gap/);
  });

  it('should be responsive', () => {
    expect(fileContent).toMatch(/sm:|md:|lg:/);
  });
});

describe('Stack Component', () => {
  let fileContent: string;

  beforeAll(() => {
    const filePath = resolve(__dirname, '../../src/components/primitives/Stack.astro');
    fileContent = readFileSync(filePath, 'utf-8');
  });

  it('should exist and be readable', () => {
    expect(fileContent).toBeDefined();
    expect(fileContent.length).toBeGreaterThan(0);
  });

  it('should use flexbox or grid for stacking', () => {
    expect(fileContent).toMatch(/flex|grid|space-y/);
  });

  it('should support space/gap prop', () => {
    expect(fileContent).toMatch(/space|gap/);
  });

  it('should stack vertically by default', () => {
    expect(fileContent).toMatch(/flex-col|space-y|grid/);
  });

  it('should support slot for children', () => {
    expect(fileContent).toContain('<slot');
  });
});

describe('Section Component', () => {
  let fileContent: string;

  beforeAll(() => {
    const filePath = resolve(__dirname, '../../src/components/primitives/Section.astro');
    fileContent = readFileSync(filePath, 'utf-8');
  });

  it('should exist and be readable', () => {
    expect(fileContent).toBeDefined();
    expect(fileContent.length).toBeGreaterThan(0);
  });

  it('should use semantic section element', () => {
    expect(fileContent).toMatch(/<Element|as: Element = 'section'/);
  });

  it('should support padding prop', () => {
    expect(fileContent).toMatch(/padding|py-|px-/);
  });

  it('should support container prop', () => {
    expect(fileContent).toMatch(/container|max-w/);
  });

  it('should support slot for children', () => {
    expect(fileContent).toContain('<slot');
  });
});

describe('BadgePill Component', () => {
  let fileContent: string;

  beforeAll(() => {
    const filePath = resolve(__dirname, '../../src/components/primitives/BadgePill.astro');
    fileContent = readFileSync(filePath, 'utf-8');
  });

  it('should exist and be readable', () => {
    expect(fileContent).toBeDefined();
    expect(fileContent.length).toBeGreaterThan(0);
  });

  it('should have pill/rounded styling', () => {
    expect(fileContent).toMatch(/rounded-full|pill/);
  });

  it('should support size variants', () => {
    expect(fileContent).toMatch(/size|text-xs|text-sm/);
  });

  it('should delegate to Badge pill variant', () => {
    expect(fileContent).toMatch(/Badge/);
    expect(fileContent).toMatch(/variant=["']pill["']/);
  });
});

describe('GradientOverlay Component', () => {
  let fileContent: string;

  beforeAll(() => {
    const filePath = resolve(__dirname, '../../src/components/primitives/GradientOverlay.astro');
    fileContent = readFileSync(filePath, 'utf-8');
  });

  it('should exist and be readable', () => {
    expect(fileContent).toBeDefined();
    expect(fileContent.length).toBeGreaterThan(0);
  });

  it('should have gradient styling', () => {
    expect(fileContent).toMatch(/gradient|from-|to-/);
  });

  it('should support variant prop', () => {
    expect(fileContent).toContain('variant');
  });

  it('should support direction prop', () => {
    expect(fileContent).toMatch(/direction|tl|tr|bl|br/);
  });

  it('should be absolutely positioned', () => {
    expect(fileContent).toMatch(/absolute|relative/);
  });
});

/**
 * EducationCard Component Tests
 * Tests for the EducationCard component structure and rendering
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('EducationCard Component', () => {
  let fileContent: string;

  beforeAll(() => {
    const filePath = resolve(__dirname, '../../src/components/features/about/EducationCard.astro');
    fileContent = readFileSync(filePath, 'utf-8');
  });

  describe('Structure', () => {
    it('should exist and be readable', () => {
      expect(fileContent).toBeDefined();
      expect(fileContent.length).toBeGreaterThan(0);
    });

    it('should have TypeScript type definitions', () => {
      expect(fileContent).toContain('export interface Props');
      expect(fileContent).toContain('institution: string');
      expect(fileContent).toContain('degree: string');
      expect(fileContent).toContain('description?: string');
    });

    it('should use semantic container div', () => {
      expect(fileContent).toContain('<div');
    });
  });

  describe('Props Handling', () => {
    it('should destructure required props', () => {
      expect(fileContent).toContain('institution');
      expect(fileContent).toContain('degree');
      expect(fileContent).toContain('description');
      expect(fileContent).toContain('Astro.props');
    });

    it('should handle all three props', () => {
      expect(fileContent).toContain('{institution}');
      expect(fileContent).toContain('{degree}');
    });

    it('should conditionally render description', () => {
      expect(fileContent).toContain('{description &&');
      expect(fileContent).toContain('{description}');
    });
  });

  describe('Accessibility', () => {
    it('should use heading element for institution name', () => {
      expect(fileContent).toContain('<h3');
      expect(fileContent).toContain('{institution}');
    });

    it('should have proper heading hierarchy', () => {
      expect(fileContent).toMatch(/<h3.*institution/s);
    });

    it('should use semantic SVG with proper attributes', () => {
      expect(fileContent).toContain('<svg');
      expect(fileContent).toContain('xmlns="http://www.w3.org/2000/svg"');
    });
  });

  describe('Styling', () => {
    it('should have card styling', () => {
      expect(fileContent).toContain('Card');
      expect(fileContent).toContain('rounded');
    });

    it('should have responsive typography', () => {
      expect(fileContent).toMatch(/text-(xl|2xl|sm)/);
      expect(fileContent).toMatch(/@sm:text-/);
      expect(fileContent).toContain('containerQuery');
    });

    it('should have hover effects', () => {
      expect(fileContent).toContain('hover:');
    });

    it('should inherit dark mode from semantic surface tokens', () => {
      expect(fileContent).toMatch(/text-foreground|bg-surface|border-border/);
    });

    it('should use group hover pattern', () => {
      expect(fileContent).toContain('group');
      expect(fileContent).toContain('group-hover:');
    });

    it('should have transition classes', () => {
      expect(fileContent).toContain('transition');
    });
  });

  describe('Icon Display', () => {
    it('should have education icon SVG', () => {
      expect(fileContent).toContain('<svg');
      expect(fileContent).toContain('viewBox="0 0 24 24"');
    });

    it('should have icon paths', () => {
      expect(fileContent).toContain('<path');
    });

    it('should have icon container with background', () => {
      expect(fileContent).toContain('bg-accent');
      expect(fileContent).toContain('rounded');
    });

    it('should have icon hover animation', () => {
      expect(fileContent).toContain('scale');
      expect(fileContent).toContain('group-hover:');
    });
  });

  describe('Content Display', () => {
    it('should display institution name prominently', () => {
      expect(fileContent).toContain('{institution}');
      expect(fileContent).toContain('font-bold');
    });

    it('should display degree information', () => {
      expect(fileContent).toContain('{degree}');
    });

    it('should conditionally show description', () => {
      expect(fileContent).toContain('{description &&');
      expect(fileContent).toContain('<p');
    });

    it('should style degree text appropriately', () => {
      expect(fileContent).toMatch(/text-sm.*\{degree\}/s);
    });
  });

  describe('Documentation', () => {
    it('should have component description', () => {
      expect(fileContent).toContain('EducationCard');
      expect(fileContent).toContain('Education display card');
    });

    it('should document component purpose', () => {
      expect(fileContent).toMatch(/educational background|institution|degree/i);
    });
  });

  describe('Layout & Composition', () => {
    it('should use flexbox for layout', () => {
      expect(fileContent).toContain('flex');
      expect(fileContent).toContain('items-start');
    });

    it('should have proper spacing', () => {
      expect(fileContent).toMatch(/p-\d+/);
      expect(fileContent).toMatch(/m[lrtb]-\d+/);
    });

    it('should have icon container with flex-shrink-0', () => {
      expect(fileContent).toContain('flex-shrink-0');
    });
  });

  describe('Interactive States', () => {
    it('should have hover state via Card lift interaction', () => {
      expect(fileContent).toContain('hover="lift"');
    });

    it('should have transition timing', () => {
      expect(fileContent).toContain('duration-');
    });

    it('should have group-based hover effects', () => {
      expect(fileContent).toContain('group-hover:');
    });

    it('should animate icon on hover', () => {
      expect(fileContent).toMatch(/group-hover:scale/);
    });

    it('should change text color on hover', () => {
      expect(fileContent).toMatch(/group-hover:text-accent/);
    });
  });

  describe('Color & Theme', () => {
    it('should use theme colors', () => {
      expect(fileContent).toMatch(/text-foreground|bg-surface|border-border/);
    });

    it('should use semantic theme tokens instead of redundant dark variants', () => {
      expect(fileContent).toMatch(/text-foreground|bg-surface|border-border/);
      expect(fileContent).not.toContain('dark:bg-surface-dark');
    });

    it('should use accent color', () => {
      expect(fileContent).toContain('accent');
    });
  });
});

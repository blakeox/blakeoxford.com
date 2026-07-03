/**
 * BlogPostCard Component Tests
 * Tests for the BlogPostCard component rendering, props, and accessibility
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('BlogPostCard Component', () => {
  let fileContent: string;

  beforeAll(() => {
    const filePath = resolve(__dirname, '../../src/components/features/blog/BlogPostCard.astro');
    fileContent = readFileSync(filePath, 'utf-8');
  });

  describe('Structure', () => {
    it('should exist and be readable', () => {
      expect(fileContent).toBeDefined();
      expect(fileContent.length).toBeGreaterThan(0);
    });

    it('should have TypeScript type definitions', () => {
      expect(fileContent).toContain('export interface Props');
      expect(fileContent).toContain('post: CollectionEntry<\'blog\'>');
      expect(fileContent).toContain('maxTags?: number');
    });

    it('should use semantic HTML article element', () => {
      expect(fileContent).toContain('<article');
    });

    it('should have a link wrapper for navigation', () => {
      expect(fileContent).toContain('<a');
      expect(fileContent).toContain('href={`/blog/${slug}/`}');
    });
  });

  describe('Props Handling', () => {
    it('should destructure post prop', () => {
      expect(fileContent).toContain('post');
      expect(fileContent).toContain('Astro.props');
    });

    it('should have default maxTags value', () => {
      expect(fileContent).toContain('maxTags = 3');
    });

    it('should extract slug and data from post', () => {
      expect(fileContent).toContain('const { id: slug, data } = post');
    });

    it('should handle visible tags with slicing', () => {
      expect(fileContent).toContain('visibleTags');
      expect(fileContent).toContain('slice');
    });

    it('should calculate extra tag count', () => {
      expect(fileContent).toContain('extraTagCount');
    });
  });

  describe('Accessibility', () => {
    it('should have semantic time element with datetime attribute', () => {
      expect(fileContent).toContain('<time');
      expect(fileContent).toContain('datetime=');
      expect(fileContent).toContain('formatDateISO');
    });

    it('should use heading element for title', () => {
      expect(fileContent).toContain('<h3');
      expect(fileContent).toContain('{data.title}');
    });

    it('should have focus-visible styles for keyboard navigation', () => {
      expect(fileContent).toContain('focus-visible:');
    });

    it('should have proper link structure', () => {
      expect(fileContent).toContain('href={`/blog/${slug}/`}');
    });
  });

  describe('Styling', () => {
    it('should have responsive typography classes', () => {
      expect(fileContent).toMatch(/text-(xl|2xl|sm)/);
      expect(fileContent).toMatch(/sm:text-/);
    });

    it('should have hover effects', () => {
      expect(fileContent).toContain('hover:');
      expect(fileContent).toMatch(/hover:(shadow|translate|-translate-y)/);
    });

    it('should have dark mode support', () => {
      expect(fileContent).toContain('dark:');
    });

    it('should use group hover pattern', () => {
      expect(fileContent).toContain('group');
      expect(fileContent).toContain('group-hover:');
    });

    it('should have transition classes', () => {
      expect(fileContent).toContain('transition');
    });
  });

  describe('Content Display', () => {
    it('should display publication date', () => {
      expect(fileContent).toContain('data.pubDate');
      expect(fileContent).toContain('toLocaleDateString');
    });

    it('should display post title', () => {
      expect(fileContent).toContain('{data.title}');
    });

    it('should conditionally render description', () => {
      expect(fileContent).toContain('{data.description &&');
      expect(fileContent).toContain('{data.description}');
    });

    it('should handle tags display', () => {
      expect(fileContent).toContain('visibleTags');
      expect(fileContent).toMatch(/(map|forEach)/);
    });
  });

  describe('Utility Integration', () => {
    it('should import formatDateISO utility', () => {
      expect(fileContent).toContain('import { formatDateISO } from \'../../../utils/index.js\'');
    });

    it('should import Astro types', () => {
      expect(fileContent).toContain('import type { CollectionEntry } from \'astro:content\'');
    });
  });

  describe('Documentation', () => {
    it('should have component description', () => {
      expect(fileContent).toContain('BlogPostCard');
      expect(fileContent).toContain('Reusable blog post card');
    });

    it('should document component purpose', () => {
      expect(fileContent).toMatch(/Displays a blog post|blog post card/i);
    });
  });

  describe('Layout & Composition', () => {
    it('should use flexbox for layout', () => {
      expect(fileContent).toContain('flex');
      expect(fileContent).toMatch(/flex-(col|row)/);
    });

    it('should have proper spacing', () => {
      expect(fileContent).toMatch(/gap-\d+/);
      expect(fileContent).toMatch(/p-\d+/);
    });

    it('should handle full height container', () => {
      expect(fileContent).toContain('h-full');
    });

    it('should have rounded corners', () => {
      expect(fileContent).toMatch(/rounded-/);
    });
  });

  describe('Interactive States', () => {
    it('should have hover state transitions', () => {
      expect(fileContent).toContain('hover:');
      expect(fileContent).toContain('duration-');
    });

    it('should have focus states', () => {
      expect(fileContent).toContain('focus-visible:');
    });

    it('should have group interaction patterns', () => {
      expect(fileContent).toContain('group');
    });
  });

  describe('Tag Handling', () => {
    it('should slice tags based on maxTags', () => {
      expect(fileContent).toContain('slice(0, maxTags)');
    });

    it('should provide fallback for missing tags', () => {
      expect(fileContent).toContain('|| []');
    });

    it('should calculate extra tags', () => {
      expect(fileContent).toMatch(/extraTagCount.*length.*visibleTags/s);
    });
  });
});

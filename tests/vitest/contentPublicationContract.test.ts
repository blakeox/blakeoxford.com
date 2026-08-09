import { describe, expect, it } from 'vitest';
import {
  comparePublishedEntries,
  requireDescription,
  requireAuthor,
} from '@/lib/content/publication-contract.mjs';

describe('content publication contract', () => {
  it('treats string false as non-featured when sorting file-based content', () => {
    const entries = [
      { frontmatter: { title: 'Older featured', date: '2024-01-01', featured: 'true' } },
      { frontmatter: { title: 'Newer standard', date: '2025-01-01', featured: 'false' } },
    ];

    entries.sort(comparePublishedEntries);

    expect(entries.map((entry) => entry.frontmatter.title)).toEqual([
      'Older featured',
      'Newer standard',
    ]);
  });

  it('rejects published entries without a description', () => {
    expect(() => requireDescription({ id: 'missing-description', frontmatter: {} })).toThrow(
      'missing a description'
    );
  });

  it('rejects published entries without an author', () => {
    expect(() => requireAuthor({ id: 'missing-author', frontmatter: {} })).toThrow(
      'missing an author'
    );
  });
});

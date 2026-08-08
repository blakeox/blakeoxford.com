import { describe, expect, it } from 'vitest';
import { validateMetadataQuality } from '@/config/seo-policy.mjs';

describe('SEO metadata policy', () => {
  it('accepts accurate metadata without imposing character ceilings', () => {
    const errors = validateMetadataQuality({
      title: 'A deliberately descriptive title that exceeds a sixty character search heuristic',
      description: 'Short but accurate.',
    });

    expect(errors).toEqual([]);
  });

  it('still rejects empty title or description values', () => {
    expect(validateMetadataQuality({ title: '', description: 'Valid' })).toEqual([
      'title is empty',
    ]);
    expect(validateMetadataQuality({ title: 'Valid', description: '   ' })).toEqual([
      'description is empty',
    ]);
  });
});

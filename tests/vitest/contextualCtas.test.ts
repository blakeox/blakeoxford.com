import { describe, expect, it } from 'vitest';
import { generateContextualCTAs } from '../../src/lib/chat/message-processing';
import type { AIChatSource } from '../../src/lib/ai-search-types';

const fabric: AIChatSource = {
  title: 'Microsoft Fabric',
  url: 'https://blakeoxford.com/projects/microsoft-fabric/',
  collection: 'projects',
};

describe('generateContextualCTAs', () => {
  it('appends a contact link when a cited source is a project on the current page', () => {
    const ctas = generateContextualCTAs(
      [fabric],
      'blakeoxford.com',
      1,
      '/projects/microsoft-fabric/'
    );

    expect(ctas.map((cta) => cta.url)).toEqual(['/contact/']);
    expect(ctas.some((cta) => cta.url.includes('/projects/microsoft-fabric'))).toBe(false);
  });

  it('recognizes a canonical project URL from a local preview host', () => {
    const ctas = generateContextualCTAs([fabric], '127.0.0.1', 1, '/projects/microsoft-fabric/');

    expect(ctas.map((cta) => cta.url)).toEqual(['/contact/']);
  });

  it('treats a project URL without a collection as a project source', () => {
    const ctas = generateContextualCTAs(
      [
        {
          title: 'Selected Work',
          url: 'https://blakeoxford.com/projects/',
        },
      ],
      'blakeoxford.com',
      1,
      '/projects/microsoft-fabric/'
    );

    expect(ctas.map((cta) => cta.url)).toEqual(['/contact/']);
  });

  it('keeps a different project link and still offers contact', () => {
    const ctas = generateContextualCTAs([fabric], 'blakeoxford.com', 1, '/about/');
    expect(ctas.map((cta) => cta.url)).toEqual([
      'https://blakeoxford.com/projects/microsoft-fabric/',
      '/contact/',
    ]);
  });
});

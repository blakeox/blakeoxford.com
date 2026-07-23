import { describe, expect, it } from 'vitest';
import { legacySearchRedirectTarget } from '../../functions/routes/legacy-search-redirect';

describe('legacySearchRedirectTarget', () => {
  it('maps retired Find index paths to /search/*', () => {
    expect(legacySearchRedirectTarget('/api/projects.json')).toBe('/search/projects.json');
    expect(legacySearchRedirectTarget('/api/blog.json')).toBe('/search/blog.json');
  });

  it('returns null for unrelated paths', () => {
    expect(legacySearchRedirectTarget('/api/ai-search')).toBeNull();
    expect(legacySearchRedirectTarget('/search/projects.json')).toBeNull();
  });
});

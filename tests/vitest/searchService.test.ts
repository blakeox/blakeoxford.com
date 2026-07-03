import { describe, it, expect, vi, beforeEach } from 'vitest';

import { resetSearchCorpusCache } from '../../src/lib/search/searchIndexLoader';
import { searchLocalCorpus } from '../../src/lib/search/localSearch';
import { runSearch } from '../../src/lib/search/searchService';
import type { SearchRecord } from '../../src/lib/search/types';

const sampleCorpus: SearchRecord[] = [
  { type: 'page', title: 'Contact', description: 'Start a session', href: '/contact/', tags: ['contact'] },
  { type: 'project', title: 'Microsoft Fabric', description: 'Operational intelligence', href: '/projects/microsoft-fabric/', tags: ['fabric'] },
  { type: 'blog', title: 'CES 2026', description: 'AI has left the screen', href: '/blog/ces-2026-ai-has-left-the-screen/', tags: ['ai'] },
];

describe('searchLocalCorpus', () => {
  it('returns featured browse results for empty query', () => {
    const results = searchLocalCorpus(sampleCorpus, '', 'all', 5);
    expect(results.length).toBeGreaterThan(0);
  });

  it('matches blog posts by keyword', () => {
    const results = searchLocalCorpus(sampleCorpus, 'ces', 'blog', 5);
    expect(results[0]?.href).toContain('ces-2026');
  });
});

describe('runSearch', () => {
  beforeEach(() => {
    resetSearchCorpusCache();
    vi.restoreAllMocks();
  });

  it('falls back to local search when Cloudflare semantic search is unavailable', async () => {
    vi.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/api/projects.json')) {
        return new Response(JSON.stringify([{ slug: 'microsoft-fabric', title: 'Microsoft Fabric', description: 'Fabric project', tags: ['fabric'] }]), { status: 200 });
      }
      if (url.includes('/api/blog.json')) {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      if (url.includes('/api/semantic-search')) {
        return new Response(JSON.stringify({ error: 'Semantic search not configured' }), { status: 503 });
      }
      return new Response('{}', { status: 404 });
    });

    const result = await runSearch({ query: 'fabric', category: 'projects', limit: 5 });
    expect(result.source).toBe('local-fallback');
    expect(result.records.some((record) => record.href.includes('microsoft-fabric'))).toBe(true);
  });

  it('uses Cloudflare semantic search when available', async () => {
    vi.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/api/projects.json')) {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      if (url.includes('/api/blog.json')) {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      if (url.includes('/api/semantic-search')) {
        return new Response(JSON.stringify({
          results: [{
            id: 'blog-test',
            score: 0.92,
            title: 'CES 2026',
            description: 'AI has left the screen',
            url: 'https://blakeoxford.com/blog/ces-2026-ai-has-left-the-screen/',
            collection: 'blog',
            tags: ['ai'],
          }],
        }), { status: 200 });
      }
      return new Response('{}', { status: 404 });
    });

    const result = await runSearch({ query: 'ces', category: 'blog', limit: 5 });
    expect(result.source).toBe('cloudflare-vectorize');
    expect(result.records[0]?.type).toBe('blog');
  });
});

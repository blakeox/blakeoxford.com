import { describe, it, expect, vi, beforeEach } from 'vitest';

import { resetSearchCorpusCache } from '../../src/lib/search/searchIndexLoader';
import { searchLocalCorpus } from '../../src/lib/search/localSearch';
import { filterNoisyHubRecords, runSearch } from '../../src/lib/search/searchService';
import type { SearchRecord } from '../../src/lib/search/types';

const sampleCorpus: SearchRecord[] = [
  {
    type: 'page',
    title: 'Contact',
    description: 'Start a session',
    href: '/contact/',
    tags: ['contact'],
  },
  {
    type: 'project',
    title: 'Microsoft Fabric',
    description: 'Operational intelligence',
    href: '/projects/microsoft-fabric/',
    tags: ['fabric'],
  },
  {
    type: 'blog',
    title: 'CES 2026',
    description: 'AI has left the screen',
    href: '/blog/ces-2026-ai-has-left-the-screen/',
    tags: ['ai'],
  },
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
      if (url.includes('/search/projects.json')) {
        return new Response(
          JSON.stringify([
            {
              slug: 'microsoft-fabric',
              title: 'Microsoft Fabric',
              description: 'Fabric project',
              tags: ['fabric'],
            },
          ]),
          { status: 200 }
        );
      }
      if (url.includes('/search/blog.json')) {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      if (url.includes('/api/semantic-search')) {
        return new Response(JSON.stringify({ error: 'Semantic search not configured' }), {
          status: 503,
        });
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
      if (url.includes('/search/projects.json')) {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      if (url.includes('/search/blog.json')) {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      if (url.includes('/api/semantic-search')) {
        return new Response(
          JSON.stringify({
            results: [
              {
                id: 'blog-test',
                score: 0.92,
                title: 'CES 2026',
                description: 'AI has left the screen',
                url: 'https://blakeoxford.com/blog/ces-2026-ai-has-left-the-screen/',
                collection: 'blog',
                tags: ['ai'],
              },
            ],
          }),
          { status: 200 }
        );
      }
      return new Response('{}', { status: 404 });
    });

    const result = await runSearch({ query: 'ces', category: 'blog', limit: 5 });
    expect(result.source).toBe('cloudflare-vectorize');
    expect(result.records[0]?.type).toBe('blog');
  });

  it('falls back to local search when semantic returns empty results', async () => {
    vi.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/search/projects.json')) {
        return new Response(
          JSON.stringify([
            {
              slug: 'microsoft-fabric',
              title: 'Microsoft Fabric',
              description: 'Fabric project',
              tags: ['fabric'],
            },
          ]),
          { status: 200 }
        );
      }
      if (url.includes('/search/blog.json')) {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      if (url.includes('/api/semantic-search')) {
        return new Response(JSON.stringify({ results: [] }), { status: 200 });
      }
      return new Response('{}', { status: 404 });
    });

    const result = await runSearch({ query: 'fabric', category: 'all', limit: 5 });
    expect(result.source).toBe('local-fallback');
    expect(result.records.some((record) => record.href.includes('microsoft-fabric'))).toBe(true);
  });

  it('drops noisy hub pages for keyword queries when semantic returns them', async () => {
    vi.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/search/projects.json')) {
        return new Response(
          JSON.stringify([
            {
              slug: 'microsoft-fabric',
              title: 'Microsoft Fabric – Operational Intelligence & Workflow Automation',
              description: 'Fabric project',
              tags: ['fabric', 'automation'],
            },
          ]),
          { status: 200 }
        );
      }
      if (url.includes('/search/blog.json')) {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      if (url.includes('/api/semantic-search')) {
        return new Response(
          JSON.stringify({
            results: [
              {
                id: 'page-projects',
                score: 0.91,
                title: 'Projects',
                description: 'Browse projects',
                url: 'https://blakeoxford.com/projects/',
                collection: 'pages',
                tags: [],
              },
              {
                id: 'page-blog',
                score: 0.89,
                title: 'Blog',
                description: 'Browse posts',
                url: 'https://blakeoxford.com/blog/',
                collection: 'pages',
                tags: [],
              },
              {
                id: 'project-fabric',
                score: 0.72,
                title: 'Microsoft Fabric – Operational Intelligence & Workflow Automation',
                description: 'Automation workflows',
                url: 'https://blakeoxford.com/projects/microsoft-fabric/',
                collection: 'projects',
                tags: ['automation'],
              },
            ],
          }),
          { status: 200 }
        );
      }
      return new Response('{}', { status: 404 });
    });

    const result = await runSearch({ query: 'automation', category: 'all', limit: 8 });
    expect(result.records.some((record) => record.title === 'Projects')).toBe(false);
    expect(result.records.some((record) => record.title === 'Blog')).toBe(false);
    expect(result.records[0]?.href).toContain('microsoft-fabric');
  });

  it('returns no results when a query has no keyword hit and no strong semantic hit', async () => {
    vi.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/search/projects.json') || url.includes('/search/blog.json')) {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      if (url.includes('/api/semantic-search')) {
        return new Response(
          JSON.stringify({
            results: [
              {
                id: 'project-neighbor',
                score: 0.54,
                title: 'Fanalyx',
                description: 'Deterministic finance',
                url: 'https://blakeoxford.com/projects/fanalyx-deterministic-finance-platform/',
                collection: 'projects',
                tags: ['finance'],
              },
            ],
          }),
          { status: 200 }
        );
      }
      return new Response('{}', { status: 404 });
    });

    const result = await runSearch({ query: 'zzzz-no-match', category: 'all', limit: 8 });
    expect(result.records).toEqual([]);
  });

  it('keeps a keyword hit for migration even when semantic neighbors are weak', async () => {
    vi.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/search/projects.json')) {
        return new Response(
          JSON.stringify([
            {
              slug: 'google-workspace-migration',
              title: 'Google Workspace migration',
              description: 'Mailbox cutover',
              tags: ['migration'],
            },
          ]),
          { status: 200 }
        );
      }
      if (url.includes('/search/blog.json')) {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      if (url.includes('/api/semantic-search')) {
        return new Response(
          JSON.stringify({
            results: [
              {
                id: 'project-weak',
                score: 0.51,
                title: 'Ferment',
                description: 'Batch tracking',
                url: 'https://blakeoxford.com/projects/ferment-app/',
                collection: 'projects',
                tags: ['mobile'],
              },
            ],
          }),
          { status: 200 }
        );
      }
      return new Response('{}', { status: 404 });
    });

    const result = await runSearch({ query: 'migration', category: 'all', limit: 8 });
    expect(
      result.records.some((record) => record.href.includes('google-workspace-migration'))
    ).toBe(true);
    expect(result.records.some((record) => record.href.includes('ferment-app'))).toBe(false);
  });
});

describe('filterNoisyHubRecords', () => {
  it('keeps hub pages when the query matches the title', () => {
    const records: SearchRecord[] = [
      { type: 'page', title: 'Projects', description: '', href: '/projects/', tags: [] },
    ];
    expect(filterNoisyHubRecords(records, 'projects')).toHaveLength(1);
  });

  it('drops hub pages when the query does not match the title', () => {
    const records: SearchRecord[] = [
      { type: 'page', title: 'Projects', description: 'automation', href: '/projects/', tags: [] },
      {
        type: 'project',
        title: 'Fabric',
        description: 'automation',
        href: '/projects/fabric/',
        tags: [],
      },
    ];
    const filtered = filterNoisyHubRecords(records, 'automation');
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.type).toBe('project');
  });
});

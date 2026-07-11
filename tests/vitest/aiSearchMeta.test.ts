import { describe, expect, it } from 'vitest';
import { formatAISearchProvenance, readAISearchMeta } from '../../src/lib/ai-search';

describe('readAISearchMeta', () => {
  it('reads Cloudflare Worker headers', () => {
    const response = new Response('{}', {
      headers: {
        'x-ai-provider': 'autorag',
        'x-cache-status': 'MISS',
        'x-query-complexity': 'complex',
      },
    });
    expect(readAISearchMeta(response)).toEqual({
      provider: 'autorag',
      cacheStatus: 'MISS',
      complexity: 'complex',
    });
  });
});

describe('formatAISearchProvenance', () => {
  it('labels cached AutoRAG answers', () => {
    expect(formatAISearchProvenance({ provider: 'autorag-cached' }, 2)).toBe(
      'Cached · cited from site index',
    );
  });

  it('labels Workers AI quick answers without citations', () => {
    expect(formatAISearchProvenance({ provider: 'workers-ai' }, 0)).toBe(
      'Quick answer · not cited from site index',
    );
  });

  it('labels cited AutoRAG answers', () => {
    expect(formatAISearchProvenance({ provider: 'autorag' }, 3)).toBe(
      'Cited from site index · AutoRAG',
    );
  });
});

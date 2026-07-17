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
  it('hides provenance when citations are already shown', () => {
    expect(formatAISearchProvenance({ provider: 'autorag-cached' }, 2)).toBeNull();
    expect(formatAISearchProvenance({ provider: 'autorag' }, 3)).toBeNull();
  });

  it('skips Workers AI chrome so answers stay conversational', () => {
    expect(formatAISearchProvenance({ provider: 'workers-ai' }, 0)).toBeNull();
  });

  it('labels cached answers only when there are no citations', () => {
    expect(formatAISearchProvenance({ provider: 'autorag-cached' }, 0)).toBe('Cached answer');
  });
});

import { describe, expect, it } from 'vitest';

import { parseCommandQuery } from '../../src/features/command-center/lib/parseQuery';
import { enrichCommandItems } from '../../src/features/command-center/lib/rankResults';
import type { CommandItem } from '../../src/features/command-center/types';

describe('parseCommandQuery', () => {
  it('detects ask prefix', () => {
    expect(parseCommandQuery('?microsoft fabric')).toEqual({
      mode: 'ask',
      query: 'microsoft fabric',
    });
  });

  it('defaults to find mode', () => {
    expect(parseCommandQuery('contact')).toEqual({ mode: 'find', query: 'contact' });
  });
});

describe('enrichCommandItems', () => {
  it('boosts title matches and adds match reason', () => {
    const items: CommandItem[] = [
      {
        id: '/projects/fabric/',
        kind: 'project',
        title: 'Microsoft Fabric Project',
        subtitle: 'Automation',
        href: '/projects/fabric/',
        tags: ['Fabric', 'Automation'],
        source: 'vectorize',
        score: 0.4,
      },
    ];

    const ranked = enrichCommandItems(items, 'fabric');
    expect(ranked[0]?.matchReason).toBeTruthy();
    expect(ranked[0]?.score).toBeGreaterThan(0.4);
  });
});

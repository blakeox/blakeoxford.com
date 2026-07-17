import { describe, expect, it } from 'vitest';

import { buildAskPrompt } from '../../src/lib/chat/ai-chat-bridge';
import { enrichCommandItems } from '../../src/features/command-center/lib/rankResults';
import type { CommandItem } from '../../src/features/command-center/types';

describe('buildAskPrompt', () => {
  it('builds a context-aware prompt for a project', () => {
    expect(
      buildAskPrompt('fabric', { sourceTitle: 'Microsoft Fabric Project', sourceKind: 'project' }),
    ).toContain('project');
    expect(
      buildAskPrompt('fabric', { sourceTitle: 'Microsoft Fabric Project', sourceKind: 'project' }),
    ).toContain('Microsoft Fabric Project');
  });

  it('builds a title-only prompt when query matches title', () => {
    const prompt = buildAskPrompt('Contact', { sourceTitle: 'Contact', sourceKind: 'page' });
    expect(prompt).toContain('page');
    expect(prompt).toContain('Contact');
  });

  it('returns trimmed query when no source title', () => {
    expect(buildAskPrompt('  hello world  ')).toBe('hello world');
  });
});

describe('enrichCommandItems', () => {
  it('boosts title matches and adds related match reason', () => {
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
    expect(ranked[0]?.matchReason).toMatch(/^Related to:/);
    expect(ranked[0]?.score).toBeGreaterThan(0.4);
  });

  it('demotes hub pages without a title term match', () => {
    const items: CommandItem[] = [
      {
        id: '/projects/',
        kind: 'page',
        title: 'Projects',
        subtitle: 'Browse work',
        href: '/projects/',
        tags: [],
        source: 'vectorize',
        score: 0.92,
      },
      {
        id: '/projects/fabric/',
        kind: 'project',
        title: 'Microsoft Fabric – Workflow Automation',
        subtitle: 'Operational intelligence',
        href: '/projects/fabric/',
        tags: ['automation'],
        source: 'vectorize',
        score: 0.5,
      },
    ];

    const ranked = enrichCommandItems(items, 'automation');
    expect(ranked[0]?.kind).toBe('project');
    expect(ranked.some((item) => item.href === '/projects/')).toBe(false);
  });
});

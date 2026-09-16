import { describe, it, expect } from 'vitest';
import type { CollectionEntry } from 'astro:content';
import { buildProjectInsights } from '../../src/content/projects/getProjectInsights';

function project(
  id: string,
  data: Partial<CollectionEntry<'projects'>['data']> & { title: string }
): CollectionEntry<'projects'> {
  return {
    id,
    collection: 'projects',
    data: {
      tags: [],
      ...data,
    },
  } as CollectionEntry<'projects'>;
}

describe('buildProjectInsights', () => {
  it('builds a featured deep cut with a number-led plaque', () => {
    const insights = buildProjectInsights([
      project('fabric', {
        title: 'Fabric',
        featured: true,
        impact: ['200 teammates enabled across 10 departments'],
        metrics: [{ metric: 'Departments', result: '10', timeline: 'Launch' }],
        highlights: ['Shared operating cadence across finance and delivery.'],
        reflection: 'The win was an operating backbone on one clock.',
      }),
      project('llm', {
        title: 'LLM Coaching',
        impact: ['45% fewer audit findings in the first quarter'],
      }),
    ]);

    expect(insights.projects).toHaveLength(2);
    expect(insights.deepCut?.projectSlug).toBe('fabric');
    expect(insights.deepCut?.thesis).toContain('Shared operating cadence');
    expect(insights.deepCut?.proof).toContain('200 teammates');
    expect(insights.deepCut?.proofFigure).toBe('200');
    expect(insights.deepCut?.proofCaption).toContain('teammates');
  });

  it('falls back to the first project when none are featured', () => {
    const insights = buildProjectInsights([
      project('other', { title: 'Other', impact: ['Other proof'] }),
    ]);

    expect(insights.deepCut?.projectSlug).toBe('other');
    expect(insights.deepCut?.proofFigure).toBe('');
    expect(insights.deepCut?.proofCaption).toBe('Other proof');
  });
});

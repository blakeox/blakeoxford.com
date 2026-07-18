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
  it('aggregates findings, patterns, and themes from case studies', () => {
    const projects = [
      project('fabric', {
        title: 'Fabric',
        featured: true,
        categories: ['Automation', 'AI & Data'],
        impact: ['200 teammates enabled'],
        metrics: [{ metric: 'Departments', result: '10', timeline: 'Launch' }],
        highlights: ['Shared operating cadence across finance and delivery.'],
        reflection: 'The win was an operating backbone on one clock.',
        lessons: [{ title: 'Instrument pilots', description: 'Scorecards before scale.' }],
      }),
      project('llm', {
        title: 'LLM Coaching',
        categories: ['AI & Data', 'Healthcare IT'],
        impact: ['45% fewer audit findings'],
        lessons: [
          { title: 'Empathy scales adoption', description: 'Tone matters.' },
          { title: 'Instrument pilots', description: 'Duplicate title should drop.' },
        ],
      }),
    ];

    const insights = buildProjectInsights(projects);

    expect(insights.caseCount).toBe(2);
    expect(insights.findings.length).toBeGreaterThan(0);
    expect(insights.findings.length).toBeLessThanOrEqual(8);
    expect(insights.findings[0]?.projectSlug).toBe('fabric');
    expect(insights.patterns.map((p) => p.title)).toEqual([
      'Instrument pilots',
      'Empathy scales adoption',
    ]);
    expect(insights.themes[0]).toEqual({ label: 'AI & Data', count: 2 });
    expect(insights.deepCut?.projectSlug).toBe('fabric');
    expect(insights.deepCut?.thesis).toContain('Shared operating cadence');
    expect(insights.deepCut?.proof).toContain('200 teammates');
  });

  it('caps findings and patterns', () => {
    const impact = Array.from({ length: 12 }, (_, i) => `Impact ${i}`);
    const lessons = Array.from({ length: 10 }, (_, i) => ({
      title: `Lesson ${i}`,
      description: `Desc ${i}`,
    }));

    const insights = buildProjectInsights([
      project('dense', { title: 'Dense', impact, lessons }),
    ]);

    expect(insights.findings).toHaveLength(8);
    expect(insights.patterns).toHaveLength(6);
  });
});

import { describe, expect, it } from 'vitest';
import {
  CONTENT_INTENTS,
  CONTENT_RELATIONSHIPS,
  CONTENT_TOPICS,
} from '../../src/config/content-architecture';

const projectRoutes = [
  '/projects/adp-workforcenow/',
  '/projects/advancedmd-implementation/',
  '/projects/bank-projections-modeling/',
  '/projects/fanalyx-deterministic-finance-platform/',
  '/projects/ferment-app/',
  '/projects/google-workspace-migration/',
  '/projects/llm-note-coaching/',
  '/projects/microsoft-fabric/',
];

const articleRoutes = [
  '/blog/ai-statistics-future-decision-making/',
  '/blog/building-my-own-local-llm-stack/',
  '/blog/ces-2026-ai-has-left-the-screen/',
  '/blog/combating-legal-ai-hallucinations/',
  '/blog/ethics-in-the-ai-age-semcacfe/',
];

describe('content architecture contract', () => {
  it('documents a primary intent for every indexable acquisition route', () => {
    const requiredRoutes = [
      '/',
      '/about/',
      '/blog/',
      '/projects/',
      '/contact/',
      ...projectRoutes,
      ...articleRoutes,
    ];

    for (const route of requiredRoutes) {
      expect(CONTENT_INTENTS[route], `${route} is missing a primary intent`).toBeTruthy();
    }
  });

  it('keeps every project and article connected to contextual evidence', () => {
    for (const route of [...projectRoutes, ...articleRoutes]) {
      expect(CONTENT_RELATIONSHIPS[route]?.length, `${route} is an orphan`).toBeGreaterThan(0);
      for (const link of CONTENT_RELATIONSHIPS[route] ?? []) {
        expect(CONTENT_INTENTS[link.href], `${route} links to an undocumented route`).toBeTruthy();
      }
    }
  });

  it('keeps one bounded, unique topic map for every acquisition route', () => {
    const requiredRoutes = [
      '/',
      '/about/',
      '/blog/',
      '/projects/',
      '/contact/',
      ...projectRoutes,
      ...articleRoutes,
    ];
    const primaryTopics = requiredRoutes.map((route) => {
      const topic = CONTENT_TOPICS[route];

      expect(topic, `${route} is missing a topic map entry`).toBeTruthy();
      expect(topic.primaryTopic.trim(), `${route} is missing a primary topic`).not.toBe('');
      expect(
        topic.queryThemes.length,
        `${route} needs bounded query themes`
      ).toBeGreaterThanOrEqual(2);
      expect(topic.queryThemes.length, `${route} has too many query themes`).toBeLessThanOrEqual(4);

      for (const queryTheme of topic.queryThemes) {
        expect(queryTheme.trim(), `${route} has an empty query theme`).not.toBe('');
        expect(queryTheme.length, `${route} has an overlong query theme`).toBeLessThanOrEqual(80);
      }

      return topic.primaryTopic;
    });

    expect(new Set(primaryTopics).size, 'primary topics must remain route-specific').toBe(
      requiredRoutes.length
    );
    expect(Object.keys(CONTENT_TOPICS).sort()).toEqual(requiredRoutes.slice().sort());
  });
});

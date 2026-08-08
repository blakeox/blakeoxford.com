import { describe, expect, it } from 'vitest';
import { CONTENT_INTENTS, CONTENT_RELATIONSHIPS } from '../../src/config/content-architecture';

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
});

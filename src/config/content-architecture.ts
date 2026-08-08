export type ContentLink = {
  href: string;
  label: string;
  kind: 'project' | 'article';
};

/** Primary intent and contextual evidence map for every indexable acquisition route. */
export const CONTENT_INTENTS: Record<string, string> = {
  '/': 'Systems architecture and workflow transformation overview',
  '/about/': 'Professional credibility and delivery background',
  '/blog/': 'Practical guidance on AI, automation, analytics, and leadership',
  '/projects/': 'Case-study hub for shipped systems and operational change',
  '/contact/': 'Qualified consultation and bottleneck-review conversion',
  '/projects/adp-workforcenow/': 'Workforce operations and reporting automation',
  '/projects/advancedmd-implementation/': 'Healthcare IT modernization and workflow governance',
  '/projects/bank-projections-modeling/': 'Finance analytics and scenario modeling',
  '/projects/fanalyx-deterministic-finance-platform/':
    'Deterministic finance software and data contracts',
  '/projects/ferment-app/': 'Offline-first product design and mobile workflow delivery',
  '/projects/google-workspace-migration/': 'Microsoft 365 migration and endpoint management',
  '/projects/llm-note-coaching/': 'Privacy-aware AI quality improvement in healthcare',
  '/projects/microsoft-fabric/': 'Operational intelligence and workflow automation',
  '/blog/ai-statistics-future-decision-making/':
    'Auditable AI-assisted analytics and decision-making',
  '/blog/building-my-own-local-llm-stack/': 'Private local AI infrastructure and self-hosting',
  '/blog/ces-2026-ai-has-left-the-screen/': 'Embedded AI, robotics, and workflow change',
  '/blog/combating-legal-ai-hallucinations/':
    'Grounded legal AI research and hallucination controls',
  '/blog/ethics-in-the-ai-age-semcacfe/':
    'AI governance, skepticism, and professional accountability',
};

export const CONTENT_RELATIONSHIPS: Record<string, ContentLink[]> = {
  '/blog/ai-statistics-future-decision-making/': [
    {
      href: '/projects/fanalyx-deterministic-finance-platform/',
      label: 'See deterministic finance in practice',
      kind: 'project',
    },
    {
      href: '/projects/microsoft-fabric/',
      label: 'Explore operational intelligence work',
      kind: 'project',
    },
  ],
  '/blog/building-my-own-local-llm-stack/': [
    {
      href: '/projects/llm-note-coaching/',
      label: 'See privacy-aware AI quality work',
      kind: 'project',
    },
  ],
  '/blog/ces-2026-ai-has-left-the-screen/': [
    {
      href: '/projects/ferment-app/',
      label: 'Explore an offline-first product build',
      kind: 'project',
    },
  ],
  '/blog/combating-legal-ai-hallucinations/': [
    {
      href: '/projects/llm-note-coaching/',
      label: 'See grounded AI quality controls',
      kind: 'project',
    },
  ],
  '/blog/ethics-in-the-ai-age-semcacfe/': [
    {
      href: '/projects/advancedmd-implementation/',
      label: 'Explore workflow governance work',
      kind: 'project',
    },
  ],
  '/projects/adp-workforcenow/': [
    {
      href: '/blog/ethics-in-the-ai-age-semcacfe/',
      label: 'Read the AI accountability perspective',
      kind: 'article',
    },
  ],
  '/projects/advancedmd-implementation/': [
    {
      href: '/blog/combating-legal-ai-hallucinations/',
      label: 'Read about trustworthy AI controls',
      kind: 'article',
    },
  ],
  '/projects/bank-projections-modeling/': [
    {
      href: '/blog/ai-statistics-future-decision-making/',
      label: 'Read about auditable decision systems',
      kind: 'article',
    },
  ],
  '/projects/fanalyx-deterministic-finance-platform/': [
    {
      href: '/blog/ai-statistics-future-decision-making/',
      label: 'Read about deterministic analytics',
      kind: 'article',
    },
  ],
  '/projects/ferment-app/': [
    {
      href: '/blog/ces-2026-ai-has-left-the-screen/',
      label: 'Read about AI beyond the screen',
      kind: 'article',
    },
  ],
  '/projects/google-workspace-migration/': [
    {
      href: '/blog/building-my-own-local-llm-stack/',
      label: 'Read about practical private infrastructure',
      kind: 'article',
    },
  ],
  '/projects/llm-note-coaching/': [
    {
      href: '/blog/combating-legal-ai-hallucinations/',
      label: 'Read about grounded AI research',
      kind: 'article',
    },
    {
      href: '/blog/building-my-own-local-llm-stack/',
      label: 'Read about private AI infrastructure',
      kind: 'article',
    },
  ],
  '/projects/microsoft-fabric/': [
    {
      href: '/blog/ai-statistics-future-decision-making/',
      label: 'Read about augmented analytics',
      kind: 'article',
    },
  ],
};

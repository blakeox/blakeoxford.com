export type ContentLink = {
  href: string;
  label: string;
  kind: 'project' | 'article';
};

export type ContentTopic = {
  primaryTopic: string;
  queryThemes: string[];
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

/** Bounded editorial topic map; query themes are planning inputs, not meta keywords. */
export const CONTENT_TOPICS: Record<string, ContentTopic> = {
  '/': {
    primaryTopic: 'Systems architecture and workflow transformation',
    queryThemes: ['workflow automation', 'systems architecture', 'operational transformation'],
  },
  '/about/': {
    primaryTopic: 'Systems architect and workflow strategist profile',
    queryThemes: ['systems architect', 'workflow strategist', 'technology delivery leadership'],
  },
  '/blog/': {
    primaryTopic: 'Practical AI, analytics, and automation insights',
    queryThemes: ['AI automation insights', 'analytics leadership', 'AI governance'],
  },
  '/projects/': {
    primaryTopic: 'Systems architecture and workflow case studies',
    queryThemes: [
      'workflow automation case studies',
      'systems architecture projects',
      'operational change projects',
    ],
  },
  '/contact/': {
    primaryTopic: 'Systems architecture and automation consultation',
    queryThemes: [
      'workflow bottleneck review',
      'automation strategy consultation',
      'systems architecture consulting',
    ],
  },
  '/projects/adp-workforcenow/': {
    primaryTopic: 'ADP Workforce Now implementation and reporting automation',
    queryThemes: [
      'ADP Workforce Now implementation',
      'payroll finance integration',
      'workforce reporting automation',
    ],
  },
  '/projects/advancedmd-implementation/': {
    primaryTopic: 'AdvancedMD healthcare operations modernization',
    queryThemes: [
      'AdvancedMD implementation',
      'healthcare IT workflow governance',
      'healthcare billing reporting',
    ],
  },
  '/projects/bank-projections-modeling/': {
    primaryTopic: 'Bank projections and scenario financial modeling',
    queryThemes: [
      'bank financial projections',
      'scenario financial modeling',
      'lender reporting automation',
    ],
  },
  '/projects/fanalyx-deterministic-finance-platform/': {
    primaryTopic: 'Deterministic finance software and data contracts',
    queryThemes: [
      'deterministic finance platform',
      'reproducible finance calculations',
      'finance API data contracts',
    ],
  },
  '/projects/ferment-app/': {
    primaryTopic: 'Offline-first fermentation recipe mobile app',
    queryThemes: [
      'offline-first mobile product',
      'fermentation recipe management',
      'mobile reminders and sharing',
    ],
  },
  '/projects/google-workspace-migration/': {
    primaryTopic: 'Google Workspace to Microsoft 365 migration',
    queryThemes: [
      'Google Workspace Microsoft 365 migration',
      'endpoint management migration',
      'workforce adoption playbook',
    ],
  },
  '/projects/llm-note-coaching/': {
    primaryTopic: 'Privacy-aware AI documentation quality coaching',
    queryThemes: [
      'AI documentation quality',
      'privacy-aware healthcare AI',
      'workflow-integrated AI coaching',
    ],
  },
  '/projects/microsoft-fabric/': {
    primaryTopic: 'Microsoft Fabric operational intelligence',
    queryThemes: [
      'Microsoft Fabric workflow automation',
      'finance operations analytics',
      'executive decision systems',
    ],
  },
  '/blog/ai-statistics-future-decision-making/': {
    primaryTopic: 'Auditable AI-assisted analytics and decision-making',
    queryThemes: [
      'AI statistics decision-making',
      'RAG CAG MCP analytics',
      'auditable augmented analytics',
    ],
  },
  '/blog/building-my-own-local-llm-stack/': {
    primaryTopic: 'Private local LLM infrastructure',
    queryThemes: [
      'private local LLM stack',
      'Ollama Open WebUI Mac Mini',
      'self-hosted AI infrastructure',
    ],
  },
  '/blog/ces-2026-ai-has-left-the-screen/': {
    primaryTopic: 'Embedded AI, robotics, and physical workflows',
    queryThemes: [
      'embedded AI workflows',
      'industrial AI robotics',
      'AI simulation and automation',
    ],
  },
  '/blog/combating-legal-ai-hallucinations/': {
    primaryTopic: 'Trustworthy legal AI research with grounded data',
    queryThemes: ['trustworthy legal AI', 'CourtListener legal research', 'grounded AI research'],
  },
  '/blog/ethics-in-the-ai-age-semcacfe/': {
    primaryTopic: 'AI governance and professional skepticism',
    queryThemes: [
      'AI governance accountability',
      'professional skepticism and AI',
      'auditable AI actions',
    ],
  },
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

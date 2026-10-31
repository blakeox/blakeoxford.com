import type { CollectionEntry } from 'astro:content';

export interface HireGroup {
  id: 'migrations' | 'automation' | 'decisions' | 'also';
  title: string;
  description: string;
  slugs: readonly string[];
}

/** Lead studies for the hire path. Figures come from each study's first impact line. */
export const HIRE_GROUPS: readonly HireGroup[] = [
  {
    id: 'migrations',
    title: 'Migrations',
    description: 'Identity, platforms, and recovery: foundations for controlled AI adoption.',
    slugs: ['google-workspace-migration', 'advancedmd-implementation', 'adp-workforcenow'],
  },
  {
    id: 'automation',
    title: 'Automation',
    description: 'Connecting data and AI to the workflows teams already run.',
    slugs: ['microsoft-fabric', 'llm-note-coaching'],
  },
  {
    id: 'decisions',
    title: 'Decision systems',
    description: 'Reliable inputs and clear assumptions for business decisions.',
    slugs: ['bank-projections-modeling'],
  },
];

export const ALSO_BUILT: HireGroup = {
  id: 'also',
  title: 'Also built',
  description: 'Product engineering experience that keeps usability and reliability in view.',
  slugs: ['ferment-app', 'fanalyx-deterministic-finance-platform'],
};

export interface HireStudyLink {
  slug: string;
  href: string;
  title: string;
  group: string;
  line: string;
}

export function projectsForSlugs(
  projects: CollectionEntry<'projects'>[],
  slugs: readonly string[]
): CollectionEntry<'projects'>[] {
  const byId = new Map(projects.map((project) => [project.id, project]));
  return slugs.flatMap((slug) => {
    const project = byId.get(slug);
    return project ? [project] : [];
  });
}

/** One linked proof line per hire group, copied from that study's first impact line. */
export function leadStudies(projects: CollectionEntry<'projects'>[]): HireStudyLink[] {
  return HIRE_GROUPS.flatMap((group) => {
    const project = projectsForSlugs(projects, group.slugs)[0];
    const line = project?.data.impact?.[0];
    if (!project || !line) return [];
    return [
      {
        slug: project.id,
        href: `/projects/${project.id}/`,
        title: project.data.title,
        group: group.title,
        line,
      },
    ];
  });
}

export function leadProjects(
  projects: CollectionEntry<'projects'>[]
): CollectionEntry<'projects'>[] {
  return HIRE_GROUPS.flatMap((group) => projectsForSlugs(projects, [group.slugs[0]]));
}

/** Present-day relevance without relabeling historical delivery as AI work. */
export const PROJECT_AI_CONTEXT: Record<string, string> = {
  'adp-workforcenow':
    'Connecting payroll, finance, and HR illustrates the importance of clear handoffs between systems. Those foundations matter when AI begins supporting work across departmental boundaries.',
  'advancedmd-implementation':
    'Modernizing a sensitive operational workflow brings data access, review, and ownership into focus. These are also essential questions when moving AI into everyday enterprise use.',
  'bank-projections-modeling':
    'Clear assumptions and reliable inputs make decision systems useful. That discipline also matters when companies introduce AI into analysis and decision support.',
  'google-workspace-migration':
    'Identity, platform integration, and recovery planning establish the operating foundations for enterprise technology. AI adoption needs the same attention to access, ownership, and continuity.',
  'microsoft-fabric':
    'Connected operational data gives teams a shared view of the business. It is an important foundation for evaluating useful AI applications and integrating them into enterprise workflows.',
  'llm-note-coaching':
    'Documentation coaching puts AI inside an existing workflow. Scaling beyond one use case means making evaluation, human review, and ownership reusable across teams.',
  'ferment-app':
    'Offline-first product work keeps usability and reliability grounded in real conditions. When AI is introduced into a product, the same discipline helps it remain useful beyond a demo.',
  'fanalyx-deterministic-finance-platform':
    'Deterministic calculations and explicit data contracts create clear boundaries for software outputs. Those boundaries are useful when AI assists a workflow while accountability for the underlying numbers remains explicit.',
};

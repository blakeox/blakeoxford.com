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
    description: 'Platform cutovers that stayed up.',
    slugs: ['google-workspace-migration', 'advancedmd-implementation', 'adp-workforcenow'],
  },
  {
    id: 'automation',
    title: 'Automation',
    description: 'Workflows teams kept running.',
    slugs: ['microsoft-fabric', 'llm-note-coaching'],
  },
  {
    id: 'decisions',
    title: 'Decision systems',
    description: 'Numbers a committee could act on.',
    slugs: ['bank-projections-modeling'],
  },
];

export const ALSO_BUILT: HireGroup = {
  id: 'also',
  title: 'Also built',
  description: 'Products beside the operator work.',
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

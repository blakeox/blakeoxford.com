import type { CollectionEntry } from 'astro:content';
import { splitProofFigure } from '@/lib/content/splitProofFigure';
import { getProjectsSorted } from './getProjects';

export type ProjectDeepCut = {
  projectTitle: string;
  projectSlug: string;
  thesis: string;
  proof: string;
  proofFigure: string;
  proofCaption: string;
};

export type ProjectInsights = {
  projects: CollectionEntry<'projects'>[];
  deepCut: ProjectDeepCut | null;
};

/**
 * Featured case plus the sorted library for the selected-work page.
 */
export function buildProjectInsights(projects: CollectionEntry<'projects'>[]): ProjectInsights {
  return {
    projects,
    deepCut: buildDeepCut(projects),
  };
}

export async function getProjectInsights(): Promise<ProjectInsights> {
  return buildProjectInsights(await getProjectsSorted());
}

/** Featured case as the portfolio showcase lead. */
function buildDeepCut(projects: CollectionEntry<'projects'>[]): ProjectDeepCut | null {
  const featured = projects.find((project) => project.data.featured) ?? projects[0] ?? null;
  if (!featured) return null;

  const metric = featured.data.metrics?.[0];
  const proof =
    featured.data.impact?.[0]?.trim() || (metric ? `${metric.result} — ${metric.metric}` : '');

  // Capability first: what shipped, then description — reflection is last resort.
  const thesis =
    featured.data.highlights?.[0]?.trim() ||
    featured.data.description?.trim() ||
    featured.data.reflection?.trim() ||
    proof;

  if (!thesis) return null;

  const proofLine = proof && proof !== thesis ? proof : '';
  const { figure, caption } = splitProofFigure(proofLine || thesis);

  return {
    projectTitle: featured.data.title,
    projectSlug: featured.id,
    thesis,
    proof: proofLine,
    proofFigure: figure,
    proofCaption: caption || proofLine || thesis,
  };
}

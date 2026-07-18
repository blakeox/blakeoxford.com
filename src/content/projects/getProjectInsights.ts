import type { CollectionEntry } from 'astro:content';
import { getProjectsSorted } from './getProjects';

export type ProjectFinding = {
  text: string;
  projectTitle: string;
  projectSlug: string;
  kind: 'impact' | 'metric';
};

export type ProjectPattern = {
  title: string;
  description: string;
  projectTitle: string;
  projectSlug: string;
};

export type ProjectTheme = {
  label: string;
  count: number;
};

export type ProjectDeepCut = {
  projectTitle: string;
  projectSlug: string;
  thesis: string;
  proof: string;
};

export type ProjectInsights = {
  projects: CollectionEntry<'projects'>[];
  findings: ProjectFinding[];
  patterns: ProjectPattern[];
  themes: ProjectTheme[];
  caseCount: number;
  deepCut: ProjectDeepCut | null;
};

const MAX_FINDINGS = 8;
const MAX_PATTERNS = 6;

/**
 * Aggregate portfolio proof from case studies for the selected-work page.
 */
export function buildProjectInsights(
  projects: CollectionEntry<'projects'>[]
): ProjectInsights {
  const findings: ProjectFinding[] = [];
  const patterns: ProjectPattern[] = [];
  const themeCounts = new Map<string, number>();

  for (const project of projects) {
    const { title, impact, metrics, lessons, categories } = project.data;
    const slug = project.id;

    for (const category of categories ?? []) {
      themeCounts.set(category, (themeCounts.get(category) ?? 0) + 1);
    }

    for (const line of impact ?? []) {
      findings.push({
        text: line,
        projectTitle: title,
        projectSlug: slug,
        kind: 'impact',
      });
    }

    for (const row of metrics ?? []) {
      findings.push({
        text: `${row.result} — ${row.metric}`,
        projectTitle: title,
        projectSlug: slug,
        kind: 'metric',
      });
    }

    for (const lesson of lessons ?? []) {
      patterns.push({
        title: lesson.title,
        description: lesson.description,
        projectTitle: title,
        projectSlug: slug,
      });
    }
  }

  const themes = [...themeCounts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  return {
    projects,
    findings: prioritizeFindings(findings, projects).slice(0, MAX_FINDINGS),
    patterns: prioritizePatterns(patterns, projects).slice(0, MAX_PATTERNS),
    themes,
    caseCount: projects.length,
    deepCut: buildDeepCut(projects),
  };
}

export async function getProjectInsights(): Promise<ProjectInsights> {
  return buildProjectInsights(await getProjectsSorted());
}

/** Prefer findings from featured cases, then impact over raw metrics. */
function prioritizeFindings(
  findings: ProjectFinding[],
  projects: CollectionEntry<'projects'>[]
): ProjectFinding[] {
  const featured = new Set(projects.filter((p) => p.data.featured).map((p) => p.id));

  return findings.slice().sort((a, b) => {
    const featuredDelta = Number(featured.has(b.projectSlug)) - Number(featured.has(a.projectSlug));
    if (featuredDelta !== 0) return featuredDelta;
    return Number(a.kind === 'metric') - Number(b.kind === 'metric');
  });
}

/** Prefer lessons from featured cases; drop near-duplicate titles. */
function prioritizePatterns(
  patterns: ProjectPattern[],
  projects: CollectionEntry<'projects'>[]
): ProjectPattern[] {
  const featured = new Set(projects.filter((p) => p.data.featured).map((p) => p.id));
  const seen = new Set<string>();
  const ranked = patterns.slice().sort((a, b) => {
    return Number(featured.has(b.projectSlug)) - Number(featured.has(a.projectSlug));
  });

  return ranked.filter((pattern) => {
    const key = pattern.title.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Featured case as the portfolio showcase lead. */
function buildDeepCut(projects: CollectionEntry<'projects'>[]): ProjectDeepCut | null {
  const featured =
    projects.find((project) => project.data.featured) ?? projects[0] ?? null;
  if (!featured) return null;

  const metric = featured.data.metrics?.[0];
  const proof =
    featured.data.impact?.[0]?.trim() ||
    (metric ? `${metric.result} — ${metric.metric}` : '');

  // Capability first: what shipped, then description — reflection is last resort.
  const thesis =
    featured.data.highlights?.[0]?.trim() ||
    featured.data.description?.trim() ||
    featured.data.reflection?.trim() ||
    proof;

  if (!thesis) return null;

  return {
    projectTitle: featured.data.title,
    projectSlug: featured.id,
    thesis,
    proof: proof && proof !== thesis ? proof : '',
  };
}

import { getCollection, type CollectionEntry } from 'astro:content';
import { comparePublishedEntries, isPublished } from '@/lib/content/publication-contract.mjs';

/** Featured projects first, then newest. */
export async function getProjectsSorted(): Promise<CollectionEntry<'projects'>[]> {
  const projects = (await getCollection('projects')) as CollectionEntry<'projects'>[];

  return projects
    .filter(
      (project): project is CollectionEntry<'projects'> =>
        Boolean(project?.data) && isPublished(project)
    )
    .sort(comparePublishedEntries);
}

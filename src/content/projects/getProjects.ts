import { getCollection, type CollectionEntry } from 'astro:content';

// Centralized helper to fetch and sort projects content.
export async function getProjectsSorted(): Promise<CollectionEntry<'projects'>[]> {
  const projects = (await getCollection('projects')) as CollectionEntry<'projects'>[];

  return projects
    .filter((project): project is CollectionEntry<'projects'> => Boolean(project?.data))
    .sort((a, b) => {
      const ad = a.data.date ? new Date(a.data.date).getTime() : 0;
      const bd = b.data.date ? new Date(b.data.date).getTime() : 0;
      return bd - ad;
    });
}

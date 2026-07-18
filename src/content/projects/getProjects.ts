import { getCollection, type CollectionEntry } from 'astro:content';

/** Featured projects first, then newest. */
export async function getProjectsSorted(): Promise<CollectionEntry<'projects'>[]> {
  const projects = (await getCollection('projects')) as CollectionEntry<'projects'>[];

  return projects
    .filter((project): project is CollectionEntry<'projects'> => Boolean(project?.data))
    .sort((a, b) => {
      const featuredDelta = Number(b.data.featured) - Number(a.data.featured);
      if (featuredDelta !== 0) return featuredDelta;
      const ad = a.data.date ? new Date(a.data.date).getTime() : 0;
      const bd = b.data.date ? new Date(b.data.date).getTime() : 0;
      return bd - ad;
    });
}

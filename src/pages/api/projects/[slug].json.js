import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const projects = await getCollection('projects');
  return projects.map(project => ({ params: { slug: project.slug } }));
}

export async function get({ params }) {
  const { slug } = params;
  const projects = await getCollection('projects');
  const project = projects.find(p => p.slug === slug);
  return {
    body: JSON.stringify(project),
  };
}

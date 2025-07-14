import { getCollection } from 'astro:content';

export async function get() {
  const projects = await getCollection('projects');
  
  // Transform projects to match API contract
  const transformedProjects = projects.map(project => ({
    slug: project.slug,
    title: project.data.title,
    description: project.data.description,
    publishedAt: project.data.date?.toISOString().split('T')[0] || project.data.pubDate?.toISOString().split('T')[0],
    tags: project.data.tags || [],
    featured: project.data.featured,
    draft: project.data.draft || false,
    technologies: project.data.technologies || [],
    github: project.data.github,
    demo: project.data.link || project.data.demo
  }));
  
  return {
    body: JSON.stringify(transformedProjects),
  };
}

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getCollection, render } from 'astro:content';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

function ensureDir(target: string) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }
}

async function loadProjects() {
  const projects = await getCollection('projects');
  const rendered = await Promise.all(projects.map(async (project) => {
    const renderedBody = await render(project);
    return {
      slug: project.slug,
      title: project.data.title,
      description: project.data.subtitle ?? project.data.description ?? '',
      body: renderedBody?.html ?? '',
      publishedAt: project.data.date?.toISOString?.().split('T')[0] ?? '',
      tags: project.data.tags ?? [],
      categories: project.data.categories ?? [],
      featured: Boolean(project.data.featured),
      draft: Boolean(project.data.draft),
      technologies: project.data.tags ?? [],
      image: project.data.heroImage?.src ?? null
    };
  }));

  return rendered.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

async function build() {
  const projects = await loadProjects();

  const searchProjects = projects.map((project, index) => ({
    slug: project.slug,
    title: project.title,
    description: project.description,
    publishedAt: project.publishedAt,
    tags: project.tags,
    featured: index < 3,
    draft: project.draft,
    technologies: project.technologies,
    image: project.image
  }));

  const searchIndex = projects.map(project => ({
    type: 'project',
    slug: project.slug,
    title: project.title,
    description: project.description,
    body: project.body
  }));

  const outSearchDir = path.join(projectRoot, 'public/search');
  const outApiDir = path.join(projectRoot, 'public/api');
  ensureDir(outSearchDir);
  ensureDir(outApiDir);

  fs.writeFileSync(path.join(outSearchDir, 'projects.json'), JSON.stringify(searchProjects, null, 2));
  fs.writeFileSync(path.join(outApiDir, 'projects.json'), JSON.stringify(searchProjects, null, 2));

  const distDir = path.join(projectRoot, 'dist');
  const distSearchDir = path.join(distDir, 'search');
  const distApiDir = path.join(distDir, 'api');
  ensureDir(distDir);
  ensureDir(distSearchDir);
  ensureDir(distApiDir);

  fs.writeFileSync(path.join(distDir, 'search-index.json'), JSON.stringify(searchIndex, null, 2));
  fs.writeFileSync(path.join(distSearchDir, 'index.json'), JSON.stringify(searchIndex, null, 2));
  fs.writeFileSync(path.join(distApiDir, 'projects.json'), JSON.stringify(searchProjects, null, 2));

  console.log('🔍 Generated project search index');
}

build().catch((error) => {
  console.error('Failed to generate search index', error);
  process.exit(1);
});

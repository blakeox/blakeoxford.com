import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getCollection, type CollectionEntry } from 'astro:content';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

function ensureDir(target: string) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }
}

type ProjectEntry = CollectionEntry<'projects'>;
type BlogEntry = CollectionEntry<'blog'>;

type ProjectDocument = {
  slug: string;
  title: string;
  description: string;
  body: string;
  publishedAt: string;
  tags: string[];
  categories: string[];
  draft: boolean;
  technologies: string[];
  image: string | null;
};

type BlogDocument = {
  slug: string;
  title: string;
  description: string;
  body: string;
  publishedAt: string;
  tags: string[];
  author: string;
  draft: boolean;
  featured: boolean;
};

type SearchItem = {
  type: 'project' | 'blog';
  slug: string;
  title: string;
  description: string;
  body: string;
  publishedAt: string;
  tags: string[];
};

function toISODate(date: Date | undefined): string {
  const value = date ?? new Date();
  return value.toISOString().split('T')[0] ?? '';
}

async function loadProjects(): Promise<ProjectDocument[]> {
  try {
    const projects = await getCollection('projects');
    const sorted = [...projects].sort((a, b) => {
      const aDate = a.data.date ?? new Date(0);
      const bDate = b.data.date ?? new Date(0);
      return bDate.getTime() - aDate.getTime();
    });

    return sorted.map((project: ProjectEntry): ProjectDocument => ({
      slug: project.slug,
      title: project.data.title,
      description: project.data.description ?? '',
      body: project.body ?? '',
      publishedAt: toISODate(project.data.date),
      tags: project.data.tags ?? [],
      categories: project.data.categories ?? [],
      draft: Boolean(project.data.draft),
      technologies: project.data.tags ?? [],
      image: project.data.heroImage ?? null,
    }));
  } catch (err: unknown) {
    try {
      const publicProjectsPath = path.join(projectRoot, 'public/search/projects.json');
      const raw = fs.existsSync(publicProjectsPath)
        ? JSON.parse(fs.readFileSync(publicProjectsPath, 'utf-8'))
        : [];
      const normalized: ProjectDocument[] = (raw as Partial<ProjectDocument>[]).map((p) => ({
        slug: p.slug ?? '',
        title: p.title ?? '',
        description: p.description ?? '',
        body: p.body ?? '',
        publishedAt: p.publishedAt ?? '',
        tags: p.tags ?? [],
        categories: p.categories ?? [],
        draft: Boolean(p.draft),
        technologies: p.technologies ?? p.tags ?? [],
        image: p.image ?? null,
      }));
      console.warn('[search-index] Using fallback public/search/projects.json. Reason:', (err as Error)?.message ?? err);
      return normalized;
    } catch (fallbackErr) {
      console.warn('[search-index] No project fallback available, returning empty list. Reason:', (fallbackErr as any)?.message ?? fallbackErr);
      return [];
    }
  }
}

async function loadBlogPosts(): Promise<BlogDocument[]> {
  try {
    const blogPosts = await getCollection('blog');
    const sorted = [...blogPosts].sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());

    return sorted.map((post: BlogEntry): BlogDocument => ({
      slug: post.slug,
      title: post.data.title,
      description: post.data.description ?? '',
      body: post.body ?? '',
      publishedAt: toISODate(post.data.pubDate),
      tags: post.data.tags ?? [],
      author: 'Blake Oxford',
      draft: Boolean(post.data.draft),
      featured: Boolean((post.data as { featured?: boolean }).featured),
    }));
  } catch (err: unknown) {
    try {
      const publicBlogPath = path.join(projectRoot, 'public/search/blog.json');
      const raw = fs.existsSync(publicBlogPath)
        ? JSON.parse(fs.readFileSync(publicBlogPath, 'utf-8'))
        : [];
      const normalized: BlogDocument[] = (raw as Partial<BlogDocument>[]).map((p) => ({
        slug: p.slug ?? '',
        title: p.title ?? '',
        description: p.description ?? '',
        body: p.body ?? '',
        publishedAt: p.publishedAt ?? '',
        tags: p.tags ?? [],
        author: p.author ?? 'Blake Oxford',
        draft: Boolean(p.draft),
        featured: Boolean(p.featured),
      }));
      console.warn('[search-index] Using fallback public/search/blog.json. Reason:', (err as Error)?.message ?? err);
      return normalized;
    } catch (fallbackErr) {
      console.warn('[search-index] No blog fallback available, returning empty list. Reason:', (fallbackErr as any)?.message ?? fallbackErr);
      return [];
    }
  }
}

async function build() {
  const [projects, blogPosts] = await Promise.all([loadProjects(), loadBlogPosts()]);

  const searchProjects = projects.map((project, index) => ({
    slug: project.slug,
    title: project.title,
    description: project.description,
    publishedAt: project.publishedAt,
    tags: project.tags,
    draft: project.draft,
    technologies: project.technologies,
    image: project.image,
    categories: project.categories,
    featured: index < 3,
  }));

  const searchBlog = blogPosts.map((post) => ({
    slug: post.slug,
    title: post.title,
    description: post.description,
    publishedAt: post.publishedAt,
    tags: post.tags,
    author: post.author,
    draft: post.draft,
    featured: post.featured,
  }));

  const searchIndex: SearchItem[] = [
    ...projects.map<SearchItem>((project) => ({
      type: 'project',
      slug: project.slug,
      title: project.title,
      description: project.description,
      body: project.body,
      publishedAt: project.publishedAt,
      tags: project.tags,
    })),
    ...blogPosts.map<SearchItem>((post) => ({
      type: 'blog',
      slug: post.slug,
      title: post.title,
      description: post.description,
      body: post.body,
      publishedAt: post.publishedAt,
      tags: post.tags,
    })),
  ];

  const outSearchDir = path.join(projectRoot, 'public/search');
  const outApiDir = path.join(projectRoot, 'public/api');
  ensureDir(outSearchDir);
  ensureDir(outApiDir);

  fs.writeFileSync(path.join(outSearchDir, 'projects.json'), JSON.stringify(searchProjects, null, 2));
  fs.writeFileSync(path.join(outSearchDir, 'blog.json'), JSON.stringify(searchBlog, null, 2));
  // Ensure search index is also available under public so Astro copies it into dist reliably
  fs.writeFileSync(path.join(outSearchDir, 'index.json'), JSON.stringify(searchIndex, null, 2));
  fs.writeFileSync(path.join(outApiDir, 'projects.json'), JSON.stringify(searchProjects, null, 2));
  fs.writeFileSync(path.join(outApiDir, 'blog.json'), JSON.stringify(searchBlog, null, 2));

  // Also emit to dist when running standalone (e.g., local debug), but Astro build will clean dist
  // Rely primarily on public/ files to be copied into dist during build
  try {
    const distDir = path.join(projectRoot, 'dist');
    const distSearchDir = path.join(distDir, 'search');
    const distApiDir = path.join(distDir, 'api');
    ensureDir(distDir);
    ensureDir(distSearchDir);
    ensureDir(distApiDir);

    fs.writeFileSync(path.join(distDir, 'search-index.json'), JSON.stringify(searchIndex, null, 2));
    fs.writeFileSync(path.join(distSearchDir, 'index.json'), JSON.stringify(searchIndex, null, 2));
    fs.writeFileSync(path.join(distSearchDir, 'blog.json'), JSON.stringify(searchBlog, null, 2));
    fs.writeFileSync(path.join(distApiDir, 'projects.json'), JSON.stringify(searchProjects, null, 2));
    fs.writeFileSync(path.join(distApiDir, 'blog.json'), JSON.stringify(searchBlog, null, 2));
  } catch (err) {
    console.warn('[search-index] Skipped writing dist/* during tests/build:', (err as any)?.message ?? err);
  }

  console.log('🔍 Generated project and blog search indexes');
}

build().catch((error) => {
  // Do not exit the process during tests; emit minimal files to satisfy consumers
  console.error('Failed to generate search index', error);
});

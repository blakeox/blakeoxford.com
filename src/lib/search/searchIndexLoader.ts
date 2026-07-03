import { getNavSearchPages } from '../../config/navSearchPages';
import type { SearchCategory, SearchRecord } from './types';

type ApiProject = {
  slug: string;
  title: string;
  description?: string;
  tags?: string[];
  featured?: boolean;
  publishedAt?: string;
  draft?: boolean;
  image?: string | null;
};

type ApiBlog = {
  slug: string;
  title: string;
  description?: string;
  tags?: string[];
  featured?: boolean;
  publishedAt?: string;
  draft?: boolean;
  image?: string | null;
};

let cachedCorpus: SearchRecord[] | null = null;
let loadPromise: Promise<SearchRecord[]> | null = null;

function toProjectRecord(item: ApiProject): SearchRecord {
  return {
    type: 'project',
    title: item.title,
    description: item.description ?? '',
    href: `/projects/${item.slug}/`,
    tags: Array.isArray(item.tags) ? item.tags : [],
    featured: Boolean(item.featured),
    publishedAt: item.publishedAt,
    image: item.image ?? undefined,
  };
}

function toBlogRecord(item: ApiBlog): SearchRecord {
  return {
    type: 'blog',
    title: item.title,
    description: item.description ?? '',
    href: `/blog/${item.slug}/`,
    tags: Array.isArray(item.tags) ? item.tags : [],
    featured: Boolean(item.featured),
    publishedAt: item.publishedAt,
    image: item.image ?? undefined,
  };
}

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Failed to load ${url} (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export async function loadSearchCorpus(signal?: AbortSignal): Promise<SearchRecord[]> {
  if (cachedCorpus) return cachedCorpus;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const pages: SearchRecord[] = getNavSearchPages().map((page) => ({
      type: 'page',
      title: page.title,
      description: page.description,
      href: page.href,
      tags: page.tags,
    }));

    let projects: SearchRecord[] = [];
    let blogs: SearchRecord[] = [];

    try {
      const [projectJson, blogJson] = await Promise.all([
        fetchJson<ApiProject[]>('/api/projects.json', signal),
        fetchJson<ApiBlog[]>('/api/blog.json', signal),
      ]);

      projects = projectJson.filter((item) => !item.draft).map(toProjectRecord);
      blogs = blogJson.filter((item) => !item.draft).map(toBlogRecord);
    } catch (error) {
      console.warn('[search] Failed to load API indexes, using nav pages only', error);
    }

    cachedCorpus = [...pages, ...projects, ...blogs];
    return cachedCorpus;
  })();

  return loadPromise;
}

export function resetSearchCorpusCache(): void {
  cachedCorpus = null;
  loadPromise = null;
}

export function filterByCategory(records: SearchRecord[], category: SearchCategory): SearchRecord[] {
  if (category === 'all') return records;
  if (category === 'pages') return records.filter((record) => record.type === 'page');
  if (category === 'projects') return records.filter((record) => record.type === 'project');
  return records.filter((record) => record.type === 'blog');
}

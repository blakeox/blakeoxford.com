import { getNavSearchPages } from '@/config/navSearchPages';
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

const CORPUS_REQUEST_TIMEOUT_MS = 3000;

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      (async () => {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error(`Failed to load ${url} (${response.status})`);
        return response.json() as Promise<T>;
      })(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new Error('Search index deadline exceeded'));
        }, CORPUS_REQUEST_TIMEOUT_MS);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export async function loadSearchCorpus(_signal?: AbortSignal): Promise<SearchRecord[]> {
  if (cachedCorpus) return cachedCorpus;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const pages: SearchRecord[] = getNavSearchPages().map((page) => ({
      type: 'page',
      title: page.href === '/projects/' ? 'Work' : page.href === '/blog/' ? 'Writing' : page.title,
      description: page.description,
      href: page.href,
      tags: [
        ...page.tags,
        ...(page.href === '/projects/'
          ? ['work', 'portfolio']
          : page.href === '/contact/'
            ? ['email', 'talk']
            : []),
      ],
    }));

    try {
      const [projectJson, blogJson] = await Promise.all([
        fetchJson<ApiProject[]>('/search/projects.json'),
        fetchJson<ApiBlog[]>('/search/blog.json'),
      ]);

      const projects = projectJson.filter((item) => !item.draft).map(toProjectRecord);
      const blogs = blogJson.filter((item) => !item.draft).map(toBlogRecord);
      cachedCorpus = [...pages, ...projects, ...blogs];
      return cachedCorpus;
    } catch (error) {
      console.warn('[search] Content index temporarily unavailable; keeping page navigation');
      loadPromise = null;
      return pages;
    }
  })();

  return loadPromise;
}

export function resetSearchCorpusCache(): void {
  cachedCorpus = null;
  loadPromise = null;
}

export function filterByCategory(
  records: SearchRecord[],
  category: SearchCategory
): SearchRecord[] {
  if (category === 'all') return records;
  if (category === 'pages') return records.filter((record) => record.type === 'page');
  if (category === 'projects') return records.filter((record) => record.type === 'project');
  return records.filter((record) => record.type === 'blog');
}

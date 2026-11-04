import type { SearchCategory } from '@/lib/search/types';

export type CommandItemKind = 'page' | 'project' | 'blog';

export type CommandItem = {
  id: string;
  kind: CommandItemKind;
  title: string;
  subtitle: string;
  href: string;
  tags: string[];
  featured?: boolean;
  score?: number;
  publishedAt?: string;
  image?: string;
  source: 'ai-search' | 'vectorize' | 'local' | 'curated' | 'history';
  matchReason?: string;
};

export type CommandGroup = {
  id: string;
  label: string;
  items: CommandItem[];
};

export type CommandCategory = SearchCategory;

export const CATEGORY_LABELS: Record<CommandCategory, string> = {
  all: 'All',
  projects: 'Work',
  pages: 'Pages',
  blog: 'Writing',
};

/** Visitor intent suggestions use the same language as the portfolio. */
export const SUGGESTED_QUERIES = ['AI adoption', 'Automation', 'Systems integration'] as const;

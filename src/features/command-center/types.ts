import type { SearchCategory } from '../../lib/search/types';

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
  source: 'vectorize' | 'local' | 'curated' | 'history';
  matchReason?: string;
};

export type CommandMode = 'find' | 'ask';

export type CommandGroup = {
  id: string;
  label: string;
  items: CommandItem[];
};

export type CommandCategory = SearchCategory;

export const CATEGORY_LABELS: Record<CommandCategory, string> = {
  all: 'All',
  projects: 'Projects',
  pages: 'Pages',
  blog: 'Blog',
};

export const MODE_LABELS: Record<CommandMode, string> = {
  find: 'Find',
  ask: 'Ask',
};

/** Discovery terms only — avoid duplicating nav quick links like Contact. */
export const SUGGESTED_QUERIES = [
  'Microsoft Fabric',
  'CES 2026',
  'automation',
  'Power BI',
] as const;

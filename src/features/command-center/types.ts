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

/** Discovery terms only — keep the idle/empty search surface calm.
 * Lead with a known-good corpus hit so empty-state examples always work.
 */
export const SUGGESTED_QUERIES = [
  'Microsoft Fabric',
  'automation',
  'CES 2026',
] as const;

import type { CommandCategory } from '@/features/command-center/types';
import type { CommandGroup, CommandItem } from '@/features/command-center/types';

export function groupCommandItems(items: CommandItem[], category: CommandCategory): CommandGroup[] {
  if (category !== 'all') {
    const label = category === 'projects' ? 'Work' : category === 'blog' ? 'Writing' : 'Pages';
    return items.length ? [{ id: category, label, items }] : [];
  }

  const groups: CommandGroup[] = items.length
    ? [{ id: 'matches', label: `Best matches (${items.length})`, items }]
    : [];

  return groups;
}

export function flattenGroups(groups: CommandGroup[]): CommandItem[] {
  return groups.flatMap((group) => group.items);
}

export function buildBrowseGroups(
  featuredProjects: CommandItem[],
  recentPosts: CommandItem[],
  quickLinks: CommandItem[]
): CommandGroup[] {
  const groups: CommandGroup[] = [];

  if (quickLinks.length) {
    groups.push({ id: 'quick', label: 'Quick links', items: quickLinks });
  }
  if (featuredProjects.length) {
    groups.push({ id: 'featured', label: 'Featured projects', items: featuredProjects });
  }
  if (recentPosts.length) {
    groups.push({ id: 'recent', label: 'Recent posts', items: recentPosts });
  }

  return groups;
}

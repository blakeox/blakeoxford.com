import type { CommandCategory } from '@/features/command-center/types';
import type { CommandGroup, CommandItem } from '@/features/command-center/types';

const GROUP_ORDER: Array<{ id: string; label: string; kinds: CommandItem['kind'][] }> = [
  { id: 'pages', label: 'Pages', kinds: ['page'] },
  { id: 'projects', label: 'Projects', kinds: ['project'] },
  { id: 'blog', label: 'Blog', kinds: ['blog'] },
];

function groupLabel(category: CommandCategory, count: number, base: string): string {
  if (category !== 'all') return base;
  return count > 0 ? `${base} (${count})` : base;
}

export function groupCommandItems(items: CommandItem[], category: CommandCategory): CommandGroup[] {
  if (category !== 'all') {
    const label = category === 'projects' ? 'Projects' : category === 'blog' ? 'Blog' : 'Pages';
    return items.length ? [{ id: category, label, items }] : [];
  }

  const groups: CommandGroup[] = [];

  for (const spec of GROUP_ORDER) {
    const grouped = items.filter((item) => spec.kinds.includes(item.kind));
    if (grouped.length) {
      groups.push({
        id: spec.id,
        label: groupLabel(category, grouped.length, spec.label),
        items: grouped,
      });
    }
  }

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

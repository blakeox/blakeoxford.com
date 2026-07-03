import type { SearchRecord } from '../../../lib/search/types';
import type { CommandItem, CommandItemKind } from '../types';

function kindFromType(type: SearchRecord['type']): CommandItemKind {
  if (type === 'blog') return 'blog';
  if (type === 'page') return 'page';
  return 'project';
}

export function toCommandItem(
  record: SearchRecord,
  source: CommandItem['source'] = 'local',
): CommandItem {
  return {
    id: record.href,
    kind: kindFromType(record.type),
    title: record.title,
    subtitle: record.description,
    href: record.href,
    tags: record.tags,
    featured: record.featured,
    score: record.score,
    publishedAt: record.publishedAt,
    image: record.image,
    source,
  };
}

export function mapSearchResults(
  records: SearchRecord[],
  source: CommandItem['source'],
): CommandItem[] {
  return records.map((record) => toCommandItem(record, source));
}

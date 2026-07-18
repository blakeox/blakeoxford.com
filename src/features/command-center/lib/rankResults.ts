import type { CommandItem } from '../types';

const HUB_TITLES = new Set(['home', 'about', 'projects', 'blog', 'contact', 'pages']);

function normalize(text: string): string {
  return text.toLowerCase().trim();
}

function titleBoost(item: CommandItem, terms: string[]): number {
  const title = normalize(item.title);
  if (terms.some((term) => title === term)) return 0.45;
  if (terms.some((term) => title.includes(term))) return 0.35;
  return 0;
}

function descriptionBoost(item: CommandItem, terms: string[]): number {
  const subtitle = normalize(item.subtitle ?? '');
  if (!subtitle) return 0;
  return terms.some((term) => subtitle.includes(term)) ? 0.12 : 0;
}

function tagOverlap(item: CommandItem, terms: string[]): string[] {
  const tags = item.tags.map(normalize);
  return terms.filter((term) => tags.some((tag) => tag.includes(term) || term.includes(tag)));
}

function hubPenalty(item: CommandItem, terms: string[]): number {
  if (item.kind !== 'page') return 0;
  const title = normalize(item.title);
  if (!HUB_TITLES.has(title)) return 0;
  if (terms.some((term) => title.includes(term))) return 0;
  return -0.55;
}

function imageBoost(item: CommandItem): number {
  return item.image ? 0.04 : 0;
}

export function enrichCommandItems(items: CommandItem[], query: string): CommandItem[] {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return items;

  return items
    .map((item) => {
      const overlap = tagOverlap(item, terms);
      const boost = titleBoost(item, terms);
      const descBoost = descriptionBoost(item, terms);
      const baseScore = item.score ?? 0;
      const score = Math.min(
        1,
        Math.max(
          0,
          baseScore +
            boost +
            descBoost +
            overlap.length * 0.05 +
            imageBoost(item) +
            hubPenalty(item, terms)
        )
      );

      // Only surface human-useful reasons — never "Semantic match".
      let matchReason: string | undefined;
      if (overlap.length) {
        matchReason = `Related to: ${overlap.slice(0, 3).join(', ')}`;
      }

      return { ...item, score, matchReason };
    })
    .filter((item) => {
      if (item.kind !== 'page') return true;
      if (!HUB_TITLES.has(normalize(item.title))) return true;
      return terms.some((term) => normalize(item.title).includes(term));
    })
    .sort((a, b) => {
      const scoreDelta = (b.score ?? 0) - (a.score ?? 0);
      if (scoreDelta !== 0) return scoreDelta;
      return Number(Boolean(b.featured)) - Number(Boolean(a.featured));
    });
}

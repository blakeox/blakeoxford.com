import type { CommandItem } from '../types';

function normalize(text: string): string {
  return text.toLowerCase().trim();
}

function titleBoost(item: CommandItem, terms: string[]): number {
  const title = normalize(item.title);
  return terms.some((term) => title.includes(term)) ? 0.35 : 0;
}

function tagOverlap(item: CommandItem, terms: string[]): string[] {
  const tags = item.tags.map(normalize);
  return terms.filter((term) => tags.some((tag) => tag.includes(term) || term.includes(tag)));
}

export function enrichCommandItems(items: CommandItem[], query: string): CommandItem[] {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return items;

  return items
    .map((item) => {
      const overlap = tagOverlap(item, terms);
      const boost = titleBoost(item, terms);
      const baseScore = item.score ?? 0;
      const score = Math.min(1, baseScore + boost + overlap.length * 0.05);

      let matchReason: string | undefined;
      if (overlap.length) {
        matchReason = `Related to: ${overlap.slice(0, 3).join(', ')}`;
      } else if (boost > 0) {
        matchReason = 'Title match';
      } else if (baseScore > 0.65) {
        matchReason = 'Semantic match';
      }

      return { ...item, score, matchReason };
    })
    .sort((a, b) => {
      const scoreDelta = (b.score ?? 0) - (a.score ?? 0);
      if (scoreDelta !== 0) return scoreDelta;
      return Number(Boolean(b.featured)) - Number(Boolean(a.featured));
    });
}

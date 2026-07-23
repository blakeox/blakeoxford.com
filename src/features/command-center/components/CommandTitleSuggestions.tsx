import { SECTION_LABEL } from '@/features/overlay/overlayStyles';
import type { CommandItem } from '@/features/command-center/types';

type CommandTitleSuggestionsProps = {
  query: string;
  items: CommandItem[];
  onSelect: (title: string) => void;
};

/**
 * Up to 3 title autocompletes while typing — completes the query, not a chip cloud.
 */
export function CommandTitleSuggestions({ query, items, onSelect }: CommandTitleSuggestionsProps) {
  const trimmed = query.trim().toLowerCase();
  if (trimmed.length < 2) return null;

  const tokens = trimmed.split(/\s+/).filter(Boolean);
  const suggestions = items
    .filter((item) => {
      const title = item.title.toLowerCase();
      return tokens.every((token) => title.includes(token));
    })
    .sort((a, b) => {
      const aStarts = a.title.toLowerCase().startsWith(trimmed) ? 1 : 0;
      const bStarts = b.title.toLowerCase().startsWith(trimmed) ? 1 : 0;
      if (bStarts !== aStarts) return bStarts - aStarts;
      return a.title.length - b.title.length;
    })
    .filter((item, index, list) => list.findIndex((entry) => entry.title === item.title) === index)
    .slice(0, 3)
    // Skip exact matches — the query is already complete
    .filter((item) => item.title.toLowerCase() !== trimmed);

  if (!suggestions.length) return null;

  return (
    <section className="mb-2" aria-label="Title suggestions">
      <h3 className={`${SECTION_LABEL} mb-1 px-1`}>Matching titles</h3>
      <div className="flex flex-col">
        {suggestions.map((item) => (
          <button
            key={`suggest-${item.id}`}
            type="button"
            className="focus-ring-interactive flex items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-left text-sm text-foreground transition hover:bg-surface-subtle"
            onClick={() => onSelect(item.title)}
          >
            <span className="truncate">{item.title}</span>
            <span className="shrink-0 text-xxs text-subtle-foreground">Tab</span>
          </button>
        ))}
      </div>
    </section>
  );
}

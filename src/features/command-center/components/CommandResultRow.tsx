import { formatRelativeDate } from '@/lib/string-utils';
import type { CommandItem } from '@/features/command-center/types';

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Highlight each meaningful query token (not only the full string). */
export function HighlightText({ text, query }: { text: string; query: string }) {
  const tokens = query
    .trim()
    .split(/\s+/)
    .map((token) => token.replace(/^["'`]+|["'`]+$/g, ''))
    .filter((token) => token.length > 1);

  if (!tokens.length) return <>{text}</>;

  const patterns = tokens.map((token) => {
    const escaped = escapeRegExp(token);
    return /^[a-z0-9]{2}$/i.test(token) ? `\\b${escaped}\\b` : escaped;
  });
  const regex = new RegExp(`(${patterns.join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) => {
        if (!part) return null;
        if (index % 2 === 1) {
          return (
            <mark key={`${part}-${index}`} className="rounded bg-accent/20 px-0.5 text-foreground">
              {part}
            </mark>
          );
        }
        return <span key={`${part}-${index}`}>{part}</span>;
      })}
    </>
  );
}

function buildSubtitle(item: CommandItem, includeTags: boolean): string | undefined {
  const description = item.subtitle?.trim() || undefined;
  const tagLine = includeTags && item.tags.length ? item.tags.slice(0, 3).join(' · ') : undefined;
  const relatedReason = item.matchReason?.startsWith('Related to:') ? item.matchReason : undefined;
  const base = description || tagLine || relatedReason;
  const relative = item.kind === 'blog' ? formatRelativeDate(item.publishedAt) : null;

  if (base && relative) return `${base} · ${relative}`;
  if (relative) return relative;
  return base;
}

type CommandResultRowProps = {
  item: CommandItem;
  index: number;
  query: string;
  isActive: boolean;
  onSelect: (item: CommandItem) => void;
  onHover: (index: number) => void;
};

export function CommandResultRow({
  item,
  index,
  query,
  isActive,
  onSelect,
  onHover,
}: CommandResultRowProps) {
  const subtitle = buildSubtitle(item, true);

  return (
    <a
      href={item.href}
      tabIndex={-1}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        onSelect(item);
      }}
      aria-labelledby={`command-title-${index}`}
      aria-describedby={subtitle ? `command-subtitle-${index}` : undefined}
      id={`command-result-${index}`}
      role="option"
      aria-selected={isActive}
      data-index={index}
      data-search-result
      data-search-source={item.source}
      data-search-score={typeof item.score === 'number' ? String(item.score) : undefined}
      data-vectorize-score={
        item.source === 'vectorize' && typeof item.score === 'number'
          ? String(item.score)
          : undefined
      }
      className={`search-result focus-ring-interactive flex border-l-2 transition-colors ${isActive ? 'border-accent/60 bg-surface-subtle' : 'border-transparent hover:bg-surface-subtle'}`}
      onMouseEnter={() => onHover(index)}
    >
      <div className="min-w-0 flex-1">
        <span
          id={`command-title-${index}`}
          className="line-clamp-2 text-sm leading-snug font-medium [overflow-wrap:anywhere] text-foreground"
        >
          <HighlightText text={item.title} query={query} />
        </span>
        {subtitle ? (
          <span
            id={`command-subtitle-${index}`}
            className="mt-1 line-clamp-1 text-xs leading-normal [overflow-wrap:anywhere] text-muted-foreground"
          >
            <HighlightText text={subtitle} query={query} />
          </span>
        ) : null}
      </div>
      <svg
        className="shrink-0 self-center text-muted-foreground"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </a>
  );
}

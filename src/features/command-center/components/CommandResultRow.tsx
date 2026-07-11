import type { CommandItem } from '../types';
import { RESULT_ROW_ACTIVE, RESULT_ROW_BASE, RESULT_ROW_IDLE } from '../../overlay/overlayStyles';

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;

  const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <mark key={`${part}-${index}`} className="rounded bg-accent/20 px-0.5 text-foreground">
            {part}
          </mark>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        ),
      )}
    </>
  );
}

function kindGlyph(kind: CommandItem['kind']): string {
  if (kind === 'blog') return 'B';
  if (kind === 'page') return 'Pg';
  return 'P';
}

function PageIcon() {
  return (
    <svg className="size-4 text-subtle-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 4h8l4 4v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 4v4h4" />
    </svg>
  );
}

type CommandResultRowProps = {
  item: CommandItem;
  index: number;
  query: string;
  isActive: boolean;
  /** When true, omit redundant kind label (grouped lists already have section headers). */
  hideKindLabel?: boolean;
  onSelect: (item: CommandItem) => void;
  onHover: (index: number) => void;
  /** Optional per-result Ask handoff (AutoRAG) for the active row. */
  onAsk?: (item: CommandItem) => void;
};

export function CommandResultRow({
  item,
  index,
  query,
  isActive,
  hideKindLabel = true,
  onSelect,
  onHover,
  onAsk,
}: CommandResultRowProps) {
  const relatedReason = item.matchReason?.startsWith('Related to:') ? item.matchReason : undefined;
  const tagLine = item.tags.length ? item.tags.slice(0, 3).join(' · ') : undefined;
  // Prefer real description, then tags, then a useful related-tag reason.
  const subtitle = item.subtitle?.trim() || tagLine || relatedReason;

  return (
    <div
      id={`command-result-${index}`}
      role="option"
      aria-selected={isActive}
      data-index={index}
      data-search-result
      data-search-source={item.source}
      className={`${RESULT_ROW_BASE} ${isActive ? RESULT_ROW_ACTIVE : RESULT_ROW_IDLE}`}
      onMouseEnter={() => onHover(index)}
    >
      <a
        href={item.href}
        tabIndex={-1}
        className="search-result focus-ring-interactive flex min-w-0 flex-1 items-center gap-3"
        onClick={(event) => {
          event.preventDefault();
          onSelect(item);
        }}
      >
        <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-subtle">
          {item.image ? (
            <img src={item.image} alt="" className="size-full object-cover" loading="lazy" decoding="async" />
          ) : item.kind === 'page' ? (
            <PageIcon />
          ) : (
            <span className="text-xxs font-bold uppercase text-subtle-foreground">{kindGlyph(item.kind)}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-foreground">
            <HighlightText text={item.title} query={query} />
          </span>
          {subtitle ? (
            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
              <HighlightText text={subtitle} query={query} />
            </span>
          ) : null}
        </div>

        {!hideKindLabel ? (
          <span className="shrink-0 text-xxs font-medium text-subtle-foreground capitalize">{item.kind}</span>
        ) : null}
      </a>

      {item.source === 'vectorize' && typeof item.score === 'number' && item.score >= 0.5 ? (
        <span
          className="shrink-0 tabular-nums text-xxs text-subtle-foreground"
          title="Cloudflare Vectorize relevance"
          data-vectorize-score={item.score}
        >
          {Math.round(Math.min(item.score, 1) * 100)}%
        </span>
      ) : null}

      {isActive && onAsk ? (
        <button
          type="button"
          className="focus-ring-interactive shrink-0 rounded-md border border-accent/30 bg-accent/10 px-2 py-1 text-xxs font-medium text-accent transition hover:bg-accent/15"
          aria-label={`Ask about ${item.title}`}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onAsk(item);
          }}
        >
          Ask
        </button>
      ) : isActive ? (
        <span className="shrink-0 text-xxs text-subtle-foreground" aria-hidden="true">
          ↵
        </span>
      ) : null}
    </div>
  );
}

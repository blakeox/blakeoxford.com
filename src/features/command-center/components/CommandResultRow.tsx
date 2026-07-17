import { formatRelativeDate } from '../../../lib/string-utils';
import type { CommandItem } from '../types';
import { RESULT_ROW_ACTIVE, RESULT_ROW_BASE, RESULT_ROW_IDLE } from '../../overlay/overlayStyles';

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

  const regex = new RegExp(`(${tokens.map(escapeRegExp).join('|')})`, 'gi');
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
  hideKindLabel?: boolean;
  onSelect: (item: CommandItem) => void;
  onHover: (index: number) => void;
  onAsk?: (item: CommandItem) => void;
  onCopyLink?: (item: CommandItem) => void;
  onTagClick?: (tag: string) => void;
  linkCopied?: boolean;
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
  onCopyLink,
  onTagClick,
  linkCopied = false,
}: CommandResultRowProps) {
  const drillTags = onTagClick ? item.tags.slice(0, 2) : [];
  const subtitle = buildSubtitle(item, drillTags.length === 0);
  const showFeatured = Boolean(item.featured && item.kind === 'project');

  return (
    <div
      id={`command-result-${index}`}
      role="option"
      aria-selected={isActive}
      data-index={index}
      data-search-result
      data-search-source={item.source}
      data-vectorize-score={
        item.source === 'vectorize' && typeof item.score === 'number' ? String(item.score) : undefined
      }
      className={`${RESULT_ROW_BASE} ${isActive ? RESULT_ROW_ACTIVE : RESULT_ROW_IDLE}`}
      onMouseEnter={() => onHover(index)}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
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
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate text-sm font-medium text-foreground">
                <HighlightText text={item.title} query={query} />
              </span>
              {showFeatured ? (
                <span className="shrink-0 text-xxs text-subtle-foreground">Featured</span>
              ) : null}
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
      </div>

      {drillTags.length > 0 ? (
        <div className="flex shrink-0 flex-wrap items-center gap-1 self-center">
          {drillTags.map((tag) => (
            <button
              key={`${item.id}-tag-${tag}`}
              type="button"
              className="focus-ring-interactive rounded border border-border/50 px-1.5 py-0.5 text-xxs text-muted-foreground transition hover:border-accent/40 hover:text-accent"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onTagClick?.(tag);
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      ) : null}

      {isActive ? (
        <div className="flex shrink-0 items-center gap-1 self-center">
          {onCopyLink ? (
            <button
              type="button"
              className="focus-ring-interactive rounded-md border border-border/50 px-2 py-1 text-xxs text-muted-foreground transition hover:border-accent/40 hover:text-accent"
              aria-label={linkCopied ? 'Link copied' : `Copy link for ${item.title}`}
              title="Copy link (⌘C)"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onCopyLink(item);
              }}
            >
              {linkCopied ? 'Copied' : 'Copy'}
            </button>
          ) : null}
          {onAsk ? (
            <button
              type="button"
              className="focus-ring-interactive rounded-md border border-accent/30 bg-accent-subtle px-2 py-1 text-xxs font-medium text-accent transition hover:bg-accent/15"
              aria-label={`Ask about ${item.title}`}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onAsk(item);
              }}
            >
              Ask
            </button>
          ) : (
            <span className="text-xxs text-subtle-foreground" aria-hidden="true">
              ↵
            </span>
          )}
        </div>
      ) : null}
    </div>
  );
}

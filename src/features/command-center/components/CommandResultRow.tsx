import type { CommandItem } from '../types';

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

function kindLabel(kind: CommandItem['kind']): string {
  if (kind === 'blog') return 'Blog';
  if (kind === 'page') return 'Page';
  return 'Project';
}

function PageIcon() {
  return (
    <svg className="size-5 text-subtle-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 4h8l4 4v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 4v4h4" />
    </svg>
  );
}

function AskIcon() {
  return (
    <svg className="size-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8m-8 3h5.5M21 11.5c0 4.418-4.03 8-9 8-1.15 0-2.26-.19-3.29-.54L3 21l1.1-3.3A8.35 8.35 0 0 1 3 11.5c0-4.418 4.03-8 9-8s9 3.582 9 8Z" />
    </svg>
  );
}

type CommandResultRowProps = {
  item: CommandItem;
  index: number;
  query: string;
  isActive: boolean;
  onSelect: (item: CommandItem) => void;
  onAskAbout: (item: CommandItem) => void;
  onHover: (index: number) => void;
};

export function CommandResultRow({
  item,
  index,
  query,
  isActive,
  onSelect,
  onAskAbout,
  onHover,
}: CommandResultRowProps) {
  const formattedDate = item.publishedAt
    ? new Date(item.publishedAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
    : null;

  return (
    <div
      id={`command-result-${index}`}
      role="option"
      aria-selected={isActive}
      data-index={index}
      data-search-result
      className={`command-result group/row flex min-h-[3.25rem] items-stretch gap-1 rounded-2xl border transition-all duration-200 ${
        isActive
          ? 'border-accent/50 bg-accent/10 shadow-sm ring-1 ring-accent/30'
          : 'border-border/40 bg-surface/95 hover:border-accent/40 hover:bg-surface hover:shadow-md'
      }`}
      onMouseEnter={() => onHover(index)}
    >
      <a
        href={item.href}
        tabIndex={-1}
        className="search-result focus-ring-interactive flex min-w-0 flex-1 items-start gap-3 px-3 py-3 sm:px-4"
        onClick={(event) => {
          event.preventDefault();
          onSelect(item);
        }}
      >
        <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/50 bg-surface-subtle sm:size-12">
          {item.image ? (
            <img src={item.image} alt="" className="size-full object-cover" loading="lazy" decoding="async" />
          ) : item.kind === 'page' ? (
            <PageIcon />
          ) : (
            <span className="text-xs font-bold uppercase text-subtle-foreground">{kindLabel(item.kind).slice(0, 1)}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold tracking-tight text-foreground">
            <HighlightText text={item.title} query={query} />
          </span>
          {item.subtitle ? (
            <span className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              <HighlightText text={item.subtitle} query={query} />
            </span>
          ) : null}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xxs font-semibold uppercase tracking-label text-subtle-foreground">
            <span className="inline-flex items-center rounded-full bg-surface-subtle px-2 py-0.5 ring-1 ring-border/30">
              {kindLabel(item.kind)}
            </span>
            {item.featured ? (
              <span className="inline-flex items-center rounded-full bg-accent/15 px-2 py-0.5 text-accent ring-1 ring-accent/30">
                Featured
              </span>
            ) : null}
            {formattedDate ? <span className="normal-case">{formattedDate}</span> : null}
            {item.matchReason ? (
              <span className="normal-case text-subtle-foreground">{item.matchReason}</span>
            ) : null}
            {!item.matchReason && item.score && item.score > 0.7 ? (
              <span className="normal-case text-accent">Best match</span>
            ) : null}
          </div>
        </div>
      </a>

      <button
        type="button"
        className={`command-ask-row focus-ring-interactive m-1.5 flex shrink-0 items-center gap-1.5 self-center rounded-xl border px-2.5 py-2 text-xs font-semibold transition sm:m-2 ${
          isActive
            ? 'border-accent/50 bg-accent/15 text-accent'
            : 'border-accent/30 bg-accent/10 text-accent opacity-100 hover:bg-accent/15 sm:opacity-70 sm:group-hover/row:opacity-100'
        }`}
        aria-label={`Ask AI about ${item.title}`}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onAskAbout(item);
        }}
      >
        <AskIcon />
        <span className="hidden min-[420px]:inline">Ask</span>
      </button>
    </div>
  );
}

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
  const formattedDate = item.publishedAt
    ? new Date(item.publishedAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
    : null;

  return (
    <a
      id={`command-result-${index}`}
      href={item.href}
      role="option"
      aria-selected={isActive}
      data-index={index}
      data-search-result
      tabIndex={-1}
      className={`search-result command-result focus-ring-interactive group flex min-h-[3.25rem] items-start gap-3 rounded-2xl border px-3 py-3 transition-all duration-200 sm:px-4 ${
        isActive
          ? 'border-accent/50 bg-accent/10 shadow-sm ring-1 ring-accent/30'
          : 'border-border/40 bg-surface/95 hover:border-accent/40 hover:bg-surface hover:shadow-md'
      }`}
      onMouseEnter={() => onHover(index)}
      onFocus={() => onHover(index)}
      onClick={(event) => {
        event.preventDefault();
        onSelect(item);
      }}
    >
      <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/50 bg-surface-subtle">
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
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xxs font-semibold uppercase tracking-label text-subtle-foreground">
          <span className="inline-flex items-center rounded-full bg-surface-subtle px-2 py-0.5 ring-1 ring-border/30">
            {kindLabel(item.kind)}
          </span>
          {item.featured ? (
            <span className="inline-flex items-center rounded-full bg-accent/15 px-2 py-0.5 text-accent ring-1 ring-accent/30">
              Featured
            </span>
          ) : null}
          {formattedDate ? <span>{formattedDate}</span> : null}
          {item.score && item.score > 0.7 ? (
            <span className="normal-case text-accent">Best match</span>
          ) : null}
        </div>
      </div>
    </a>
  );
}

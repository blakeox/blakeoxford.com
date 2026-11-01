import type { CommandItem } from '@/features/command-center/types';
import { getChipClasses } from '@/lib/design-system/recipes';

type Props = {
  item: CommandItem;
  copied: boolean;
  onCopy: (item: CommandItem) => void;
  onAsk: (item: CommandItem) => void;
  onTagClick: (tag: string) => void;
};

/** Real buttons outside the listbox preserve their accessibility semantics. */
export function CommandResultActions({ item, copied, onCopy, onAsk, onTagClick }: Props) {
  const quiet = getChipClasses({
    variant: 'quiet',
    size: 'sm',
    shape: 'soft',
    className: 'min-h-11',
  });
  return (
    <div
      role="group"
      aria-label={`Actions for ${item.title}`}
      className="shrink-0 border-t border-border px-4 py-3"
    >
      <div className="flex flex-wrap items-center gap-2">
        {item.tags.slice(0, 2).map((tag) => (
          <button
            key={tag}
            type="button"
            className={quiet}
            onClick={() => onTagClick(tag)}
            aria-label={`Search for ${tag}`}
          >
            {tag}
          </button>
        ))}
        <button
          type="button"
          className={quiet}
          onClick={() => onCopy(item)}
          aria-label={copied ? 'Link copied' : `Copy link for ${item.title}`}
        >
          {copied ? 'Copied' : 'Copy link'}
        </button>
        <button
          type="button"
          className={getChipClasses({
            variant: 'accent',
            size: 'sm',
            shape: 'soft',
            className: 'min-h-11',
          })}
          onClick={() => onAsk(item)}
          aria-label={`Ask about ${item.title}`}
        >
          Ask about this
        </button>
      </div>
    </div>
  );
}

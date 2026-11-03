import { useState } from 'react';
import type { CommandItem } from '@/features/command-center/types';
import { getChipClasses } from '@/lib/design-system/recipes';

type Props = {
  item: CommandItem;
  copied: boolean;
  onCopy: (item: CommandItem) => Promise<boolean>;
  onAsk: (item: CommandItem) => void;
};

/** Secondary actions stay outside the result list and leave navigation to the links. */
export function CommandResultActions({ item, copied, onCopy, onAsk }: Props) {
  const [copyError, setCopyError] = useState(false);
  const quiet = getChipClasses({
    variant: 'quiet',
    size: 'sm',
    shape: 'soft',
    className: 'min-h-11',
  });
  return (
    <div role="group" aria-label={`Actions for ${item.title}`} className="min-w-0">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={quiet}
          onClick={async () => setCopyError(!(await onCopy(item)))}
          aria-label={copied ? 'Link copied' : `Copy link for ${item.title}`}
        >
          {copied ? 'Copied' : 'Copy link'}
        </button>
        <button
          type="button"
          className={quiet}
          onClick={() => onAsk(item)}
          aria-label={`Ask about ${item.title}`}
        >
          Ask about this
        </button>
      </div>
      {copyError ? (
        <p className="mt-2 max-w-xs text-xs text-muted-foreground" role="status">
          Copy failed. Open this page to copy its address.
        </p>
      ) : null}
      <span className="sr-only" role="status">
        {copied ? 'Link copied to clipboard' : ''}
      </span>
    </div>
  );
}

import type { CommandCategory } from '../types';
import { CATEGORY_LABELS } from '../types';
import { cn } from '../../../utils/cn';

const FILTERS: CommandCategory[] = ['all', 'projects', 'blog', 'pages'];

type CommandCategoryFiltersProps = {
  category: CommandCategory;
  onChange: (category: CommandCategory) => void;
};

/** Progressive type filters — only render while the user is searching. */
export function CommandCategoryFilters({ category, onChange }: CommandCategoryFiltersProps) {
  return (
    <div
      className="flex flex-wrap gap-1.5 px-1 pb-2"
      role="tablist"
      aria-label="Filter by type"
    >
      {FILTERS.map((value) => {
        const active = category === value;
        return (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={active}
            className={cn(
              'focus-ring-interactive rounded-full px-2.5 py-1 text-xxs font-medium transition',
              active
                ? 'bg-accent-subtle text-accent'
                : 'text-muted-foreground hover:bg-surface-subtle hover:text-foreground',
            )}
            onClick={() => onChange(value)}
          >
            {CATEGORY_LABELS[value]}
          </button>
        );
      })}
    </div>
  );
}

import type { CommandCategory } from '@/features/command-center/types';
import { CATEGORY_LABELS } from '@/features/command-center/types';
import { getChipClasses } from '@/lib/design-system/recipes';

const FILTERS: CommandCategory[] = ['all', 'projects', 'blog', 'pages'];

type CommandCategoryFiltersProps = {
  category: CommandCategory;
  onChange: (category: CommandCategory) => void;
};

/** Progressive type filters — only render while the user is searching. */
export function CommandCategoryFilters({ category, onChange }: CommandCategoryFiltersProps) {
  return (
    <div className="search-filters" role="group" aria-label="Filter by type">
      {FILTERS.map((value) => {
        const active = category === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            className={getChipClasses({
              variant: 'quiet',
              size: 'sm',
              shape: 'pill',
              active,
              className: 'min-h-11',
            })}
            onClick={() => onChange(value)}
          >
            {CATEGORY_LABELS[value]}
          </button>
        );
      })}
    </div>
  );
}

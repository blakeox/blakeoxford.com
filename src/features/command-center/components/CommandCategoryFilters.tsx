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
    <div className="flex flex-wrap gap-1.5 px-1 pb-2" role="tablist" aria-label="Filter by type">
      {FILTERS.map((value) => {
        const active = category === value;
        return (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={active}
            className={getChipClasses({
              variant: 'quiet',
              size: 'xs',
              shape: 'pill',
              active,
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

import { getButtonClasses } from '@/lib/design-system/recipes';
import { cn } from '@/utils/cn';

export default function ScrollToLatestButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      className={cn(
        getButtonClasses({ variant: 'secondary', size: 'sm' }),
        'absolute right-2 bottom-2 text-xs shadow'
      )}
      type="button"
      onClick={onClick}
    >
      Jump to latest
    </button>
  );
}
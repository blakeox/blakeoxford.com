import type { CommandMode } from '../command-center/types';

type ModeSwitchProps = {
  mode: CommandMode;
  onChange: (mode: CommandMode) => void;
};

export function ModeSwitch({ mode, onChange }: ModeSwitchProps) {
  return (
    <div
      className="inline-flex shrink-0 rounded-lg border border-border/60 bg-field-bg p-0.5"
      role="tablist"
      aria-label="Search mode"
    >
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'find'}
        className={`focus-ring-interactive rounded-md px-2.5 py-1 text-xxs font-semibold transition sm:text-xs ${
          mode === 'find'
            ? 'bg-surface text-foreground shadow-sm ring-1 ring-border/70'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        onClick={() => onChange('find')}
      >
        Find
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'ask'}
        className={`focus-ring-interactive rounded-md px-2.5 py-1 text-xxs font-semibold transition sm:text-xs ${
          mode === 'ask'
            ? 'bg-surface text-foreground shadow-sm ring-1 ring-border/70'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        onClick={() => onChange('ask')}
      >
        Ask
      </button>
    </div>
  );
}

import type { CommandMode } from '../types';
import { MODE_LABELS } from '../types';

const MODE_HINTS: Record<CommandMode, string> = {
  find: 'Jump to pages & projects',
  ask: 'Chat with AI assistant',
};

type CommandModeTabsProps = {
  mode: CommandMode;
  onChange: (mode: CommandMode) => void;
};

export function CommandModeTabs({ mode, onChange }: CommandModeTabsProps) {
  const modes: CommandMode[] = ['find', 'ask'];

  return (
    <div className="border-b border-border/40 px-4 py-2.5 sm:px-5">
      <div
        className="flex rounded-xl border border-border/60 bg-field-bg p-1"
        role="tablist"
        aria-label="Search modes"
      >
        {modes.map((value) => {
          const isActive = mode === value;
          return (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={isActive}
              id={`command-mode-${value}`}
              aria-controls={`command-mode-panel-${value}`}
              title={MODE_HINTS[value]}
              className={`command-mode-segment flex min-h-10 flex-1 flex-col items-center justify-center rounded-lg px-3 py-1.5 text-center transition focus-ring-interactive touch-target ${
                isActive
                  ? 'bg-surface text-foreground shadow-sm ring-1 ring-border/50'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => onChange(value)}
            >
              <span className="text-sm font-semibold">{MODE_LABELS[value]}</span>
              <span className={`mt-0.5 hidden text-xxs sm:block ${isActive ? 'text-subtle-foreground' : 'text-subtle-foreground/80'}`}>
                {MODE_HINTS[value]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

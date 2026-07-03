import type { CommandMode } from '../types';
import { MODE_LABELS } from '../types';

type CommandModeTabsProps = {
  mode: CommandMode;
  onChange: (mode: CommandMode) => void;
};

export function CommandModeTabs({ mode, onChange }: CommandModeTabsProps) {
  const modes: CommandMode[] = ['find', 'ask'];

  return (
    <div className="flex gap-2 border-b border-border/40 px-4 py-2 sm:px-5" role="tablist" aria-label="Search modes">
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
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition touch-target focus-ring-interactive ${
              isActive
                ? 'border-accent/40 bg-accent/15 text-accent ring-1 ring-accent/30'
                : 'border-border/60 text-muted-foreground hover:border-accent hover:text-accent'
            }`}
            onClick={() => onChange(value)}
          >
            {MODE_LABELS[value]}
          </button>
        );
      })}
    </div>
  );
}

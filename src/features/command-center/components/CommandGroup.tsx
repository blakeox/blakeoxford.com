import type { ReactNode } from 'react';

type CommandGroupProps = {
  label: string;
  children: ReactNode;
};

export function CommandGroupSection({ label, children }: CommandGroupProps) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="px-1 text-xxs font-semibold uppercase tracking-label text-subtle-foreground">{label}</h3>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

export function CommandSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-2" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex animate-pulse items-start gap-3 rounded-2xl border border-border/30 bg-surface/80 px-3 py-3"
        >
          <div className="size-12 rounded-xl bg-surface-subtle" />
          <div className="flex flex-1 flex-col gap-2 py-1">
            <div className="h-3 w-2/3 rounded bg-surface-subtle" />
            <div className="h-2 w-full rounded bg-surface-subtle" />
          </div>
        </div>
      ))}
    </div>
  );
}

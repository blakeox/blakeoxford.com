import type { ReactNode } from 'react';

import { SECTION_LABEL } from '@/features/overlay/overlayStyles';

type CommandGroupProps = {
  label: string;
  children: ReactNode;
};

export function CommandGroupSection({ label, children }: CommandGroupProps) {
  return (
    <section className="flex flex-col gap-0.5">
      <h3 className={`${SECTION_LABEL} px-3 pb-1`}>{label}</h3>
      <div className="flex flex-col">{children}</div>
    </section>
  );
}

export function CommandSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-1" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex animate-pulse items-center gap-3 rounded-lg px-3 py-2.5">
          <div className="size-8 rounded-md bg-surface-subtle" />
          <div className="flex flex-1 flex-col gap-1.5">
            <div className="h-3 w-2/3 rounded bg-surface-subtle" />
            <div className="h-2 w-1/2 rounded bg-surface-subtle" />
          </div>
        </div>
      ))}
    </div>
  );
}

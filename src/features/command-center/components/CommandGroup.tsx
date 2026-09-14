import type { ReactNode } from 'react';

import {
  OVERLAY_SKELETON_LINE,
  OVERLAY_SKELETON_ROW,
  OVERLAY_SKELETON_THUMB,
  SECTION_LABEL,
} from '@/features/overlay/overlayStyles';

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
        <div key={index} className={OVERLAY_SKELETON_ROW}>
          <div className={OVERLAY_SKELETON_THUMB} />
          <div className="flex flex-1 flex-col gap-1.5">
            <div className={`${OVERLAY_SKELETON_LINE} w-2/3`} />
            <div className={`${OVERLAY_SKELETON_LINE} h-2 w-1/2`} />
          </div>
        </div>
      ))}
    </div>
  );
}

import { STATUS_PULSE_DOT, TYPING_DOT } from '@/lib/design-system/recipes';
import { cn } from '@/utils/cn';

type TypingDotsProps = {
  /** Screen-reader announcement; omit for decorative-only contexts. */
  label?: string;
  /** Softer accent pulse for listening / status (vs streaming dots). */
  variant?: 'streaming' | 'status';
  className?: string;
};

/** Shared Ask streaming / listening pulse dots. */
export function TypingDots({
  label = 'Assistant is responding',
  variant = 'streaming',
  className = '',
}: TypingDotsProps) {
  const dot = variant === 'status' ? STATUS_PULSE_DOT : TYPING_DOT;
  return (
    <span className={cn('inline-flex items-center gap-1', className)} aria-live="polite">
      {label ? <span className="sr-only">{label}</span> : null}
      <span aria-hidden="true" className={dot} />
      <span aria-hidden="true" className={cn(dot, '[animation-delay:150ms]')} />
      <span aria-hidden="true" className={cn(dot, '[animation-delay:300ms]')} />
    </span>
  );
}

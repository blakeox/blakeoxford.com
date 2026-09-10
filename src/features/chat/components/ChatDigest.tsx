/**
 * ChatDigest component
 * Displays conversation summary/digest
 */
import type { ChatDigestProps } from '@/features/chat/types';

export function ChatDigest({ show, digest }: ChatDigestProps) {
  if (!show || digest.length === 0) return null;

  return (
    <div className="border-b border-border/20 bg-surface-subtle/20 px-4 py-3 text-xs text-muted-foreground">
      <span className="text-xxs font-semibold tracking-label text-subtle-foreground uppercase">
        Conversation digest
      </span>
      <ul className="mt-2 list-disc space-y-1 pl-4 text-foreground">
        {digest.map((item, index) => (
          <li key={`digest-${index}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

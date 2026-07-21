/**
 * ChatDigest component
 * Displays conversation summary/digest
 */
import type { ChatDigestProps } from '../types';

export function ChatDigest({ show, digest }: ChatDigestProps) {
  if (!show || digest.length === 0) return null;

  return (
    <div className="border-b border-border/20 bg-surface-subtle/20 px-4 py-3 text-xs text-foreground/70">
      <span className="tracking-wide text-foreground/50 uppercase">Conversation digest</span>
      <ul className="mt-2 list-disc space-y-1 pl-4">
        {digest.map((item, index) => (
          <li key={`digest-${index}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

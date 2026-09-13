/**
 * ChatDigest component
 * Displays conversation summary/digest
 */
import type { ChatDigestProps } from '@/features/chat/types';
import { OVERLAY_SECTION_BAND, SECTION_LABEL } from '@/features/overlay/overlayStyles';

export function ChatDigest({ show, digest }: ChatDigestProps) {
  if (!show || digest.length === 0) return null;

  return (
    <div className={OVERLAY_SECTION_BAND}>
      <span className={SECTION_LABEL}>Conversation digest</span>
      <ul className="mt-2 list-disc space-y-1 pl-4 text-foreground">
        {digest.map((item, index) => (
          <li key={`digest-${index}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

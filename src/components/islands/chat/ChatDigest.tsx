/**
 * ChatDigest component
 * Displays conversation summary/digest
 */
import type { ChatDigestProps } from './types';

export function ChatDigest({ show, digest }: ChatDigestProps) {
	if (!show || digest.length === 0) return null;

	return (
		<div className="border-b border-[color:var(--border)]/20 bg-[color:var(--surface-subtle)]/20 px-4 py-3 text-xs text-[color:var(--fg)]/70">
			<span className="uppercase tracking-wide text-[color:var(--fg)]/50">Conversation digest</span>
			<ul className="mt-2 list-disc space-y-1 pl-4">
				{digest.map((item, index) => (
					<li key={`digest-${index}`}>{item}</li>
				))}
			</ul>
		</div>
	);
}

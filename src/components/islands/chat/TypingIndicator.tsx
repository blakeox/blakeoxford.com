export default function TypingIndicator() {
	return (
		<div className="px-4 py-2 text-sm text-[color:var(--fg)]/60" aria-hidden="true">
			<span className="animate-pulse">Typing…</span>
		</div>
	);
}

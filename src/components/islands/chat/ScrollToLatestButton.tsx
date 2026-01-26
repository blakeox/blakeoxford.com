import React from 'react';

export default function ScrollToLatestButton({ onClick }: { onClick: () => void }) {
	return (
		<button
			className="absolute bottom-2 right-2 inline-flex items-center gap-2 rounded-md bg-[color:var(--surface)]/90 px-3 py-1 text-xs shadow"
			type="button"
			onClick={onClick}
		>
			Jump to latest
		</button>
	);
}

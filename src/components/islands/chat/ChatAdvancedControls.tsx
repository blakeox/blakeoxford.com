/**
 * ChatAdvancedControls component
 * Displays advanced settings and session insights panel
 */
import type { ChatAdvancedControlsProps } from './types';

export function ChatAdvancedControls({
	showAdvancedControls,
	useMemory,
	showDigest,
	showAnalytics,
	messages,
	feedbackAnalytics,
	toggleMemory,
	toggleDigest,
	toggleAnalytics,
	clearConversation,
	handleExportConversation,
}: ChatAdvancedControlsProps) {
	return (
		<div
			className={`border-b border-[color:var(--border)]/30 bg-[color:var(--surface-subtle)]/40 px-4 py-0 text-xs text-[color:var(--fg)]/70 transition-[max-height,opacity,padding] duration-300 ease-out ${
				showAdvancedControls ? 'max-h-[24rem] py-3 opacity-100' : 'max-h-0 opacity-0'
			}`}
		>
			<div
				className={`${showAdvancedControls ? 'pointer-events-auto' : 'pointer-events-none'} grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]`}
			>
				<div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[color:var(--border)]/30 bg-[color:var(--surface)]/70 px-3 py-2">
					<button
						type="button"
						className={`inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border)]/40 px-2.5 py-1 text-[0.65rem] font-medium transition hover:border-[color:var(--accent)]/50 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50 ${
							useMemory ? 'bg-[color:var(--accent)]/10 text-[color:var(--accent-strong)]' : 'text-[color:var(--fg)]/70'
						}`}
						aria-label={useMemory ? 'Disable conversation memory' : 'Enable conversation memory'}
						onClick={toggleMemory}
					>
						{useMemory ? 'Memory on' : 'Memory off'}
					</button>
					<button
						type="button"
						className={`inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border)]/40 px-2.5 py-1 text-[0.65rem] font-medium transition hover:border-[color:var(--accent)]/50 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50 ${
							showDigest ? 'bg-[color:var(--accent)]/10 text-[color:var(--accent-strong)]' : 'text-[color:var(--fg)]/70'
						}`}
						aria-label={showDigest ? 'Hide conversation digest' : 'Show conversation digest'}
						onClick={toggleDigest}
					>
						Digest
					</button>
					<button
						type="button"
						className={`inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border)]/40 px-2.5 py-1 text-[0.65rem] font-medium transition hover:border-[color:var(--accent)]/50 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50 ${
							showAnalytics ? 'bg-[color:var(--accent)]/10 text-[color:var(--accent-strong)]' : 'text-[color:var(--fg)]/70'
						}`}
						aria-label={showAnalytics ? 'Hide insights' : 'Show insights'}
						onClick={toggleAnalytics}
					>
						Insights
					</button>
					<button
						type="button"
						className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border)]/40 px-2.5 py-1 text-[0.65rem] font-medium text-[color:var(--fg)]/70 transition hover:border-[color:var(--accent)]/50 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50"
						onClick={clearConversation}
					>
						Clear
					</button>
					<button
						type="button"
						className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border)]/40 px-2.5 py-1 text-[0.65rem] font-medium text-[color:var(--fg)]/70 transition hover:border-[color:var(--accent)]/50 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50 disabled:opacity-50 disabled:cursor-not-allowed"
						onClick={handleExportConversation}
						disabled={messages.length === 0}
						title="Download conversation as Markdown"
					>
						<svg className="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
						</svg>
						Export
					</button>
				</div>
				{feedbackAnalytics.totalAssistant > 0 && (
					<div className="flex flex-col gap-2 rounded-2xl border border-[color:var(--border)]/30 bg-[color:var(--surface)]/60 px-3 py-2">
						<span className="text-[0.65rem] uppercase tracking-wide text-[color:var(--fg)]/50">Session insights</span>
						<div className="grid grid-cols-2 gap-2">
							<div className="rounded-xl border border-[color:var(--border)]/30 px-2.5 py-2">
								<span className="block text-[0.6rem] text-[color:var(--fg)]/50">Replies</span>
								<span className="text-sm font-semibold text-[color:var(--fg)]">{feedbackAnalytics.totalAssistant}</span>
							</div>
							<div className="rounded-xl border border-[color:var(--border)]/30 px-2.5 py-2">
								<span className="block text-[0.6rem] text-[color:var(--fg)]/50">Helpful</span>
								<span className="text-sm font-semibold text-[color:var(--accent-strong)]">{feedbackAnalytics.positive}</span>
							</div>
							<div className="rounded-xl border border-[color:var(--border)]/30 px-2.5 py-2">
								<span className="block text-[0.6rem] text-[color:var(--fg)]/50">Needs work</span>
								<span className="text-sm font-semibold text-[color:var(--color-error-dark)] dark:text-[color:var(--color-error-light)]">{feedbackAnalytics.negative}</span>
							</div>
							{feedbackAnalytics.positiveRate !== null && (
								<div className="rounded-xl border border-[color:var(--border)]/30 px-2.5 py-2">
									<span className="block text-[0.6rem] text-[color:var(--fg)]/50">Positive rate</span>
									<span className="text-sm font-semibold text-[color:var(--fg)]">{feedbackAnalytics.positiveRate}%</span>
								</div>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

/**
 * ChatAdvancedControls component
 * Session settings panel (memory, digest, insights) — opened from header menu
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
	if (!showAdvancedControls) return null;

	return (
		<div className="border-b border-border/30 bg-surface-subtle/40 px-4 py-3 text-xs text-muted-foreground">
			<p className="mb-2 text-xxs font-semibold uppercase tracking-label text-subtle-foreground">Session settings</p>
			<div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
				<div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/40 bg-surface/80 px-3 py-2">
					<button
						type="button"
						className={`focus-ring-interactive inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xxs font-medium transition ${
							useMemory
								? 'border-accent/40 bg-accent/10 text-accent'
								: 'border-border/50 text-muted-foreground hover:border-accent/50 hover:text-accent'
						}`}
						aria-label={useMemory ? 'Disable conversation memory' : 'Enable conversation memory'}
						onClick={toggleMemory}
					>
						{useMemory ? 'Memory on' : 'Memory off'}
					</button>
					<button
						type="button"
						className={`focus-ring-interactive inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xxs font-medium transition ${
							showDigest
								? 'border-accent/40 bg-accent/10 text-accent'
								: 'border-border/50 text-muted-foreground hover:border-accent/50 hover:text-accent'
						}`}
						aria-label={showDigest ? 'Hide conversation digest' : 'Show conversation digest'}
						onClick={toggleDigest}
					>
						Digest
					</button>
					<button
						type="button"
						className={`focus-ring-interactive inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xxs font-medium transition ${
							showAnalytics
								? 'border-accent/40 bg-accent/10 text-accent'
								: 'border-border/50 text-muted-foreground hover:border-accent/50 hover:text-accent'
						}`}
						aria-label={showAnalytics ? 'Hide insights' : 'Show insights'}
						onClick={toggleAnalytics}
					>
						Insights
					</button>
					<button
						type="button"
						className="focus-ring-interactive inline-flex items-center gap-1.5 rounded-full border border-border/50 px-2.5 py-1 text-xxs font-medium text-muted-foreground transition hover:border-accent/50 hover:text-accent"
						onClick={clearConversation}
					>
						Clear
					</button>
					<button
						type="button"
						className="focus-ring-interactive inline-flex items-center gap-1.5 rounded-full border border-border/50 px-2.5 py-1 text-xxs font-medium text-muted-foreground transition hover:border-accent/50 hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
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
				{feedbackAnalytics.totalAssistant > 0 ? (
					<div className="flex flex-col gap-2 rounded-2xl border border-border/40 bg-surface/70 px-3 py-2">
						<span className="text-xxs font-semibold uppercase tracking-label text-subtle-foreground">Session insights</span>
						<div className="grid grid-cols-2 gap-2">
							<div className="rounded-xl border border-border/40 px-2.5 py-2">
								<span className="block text-xxs text-muted-foreground">Replies</span>
								<span className="text-sm font-semibold text-foreground">{feedbackAnalytics.totalAssistant}</span>
							</div>
							<div className="rounded-xl border border-border/40 px-2.5 py-2">
								<span className="block text-xxs text-muted-foreground">Helpful</span>
								<span className="text-sm font-semibold text-accent">{feedbackAnalytics.positive}</span>
							</div>
							<div className="rounded-xl border border-border/40 px-2.5 py-2">
								<span className="block text-xxs text-muted-foreground">Needs work</span>
								<span className="text-sm font-semibold text-error-emphasis">{feedbackAnalytics.negative}</span>
							</div>
							{feedbackAnalytics.positiveRate !== null ? (
								<div className="rounded-xl border border-border/40 px-2.5 py-2">
									<span className="block text-xxs text-muted-foreground">Positive rate</span>
									<span className="text-sm font-semibold text-foreground">{feedbackAnalytics.positiveRate}%</span>
								</div>
							) : null}
						</div>
					</div>
				) : null}
			</div>
		</div>
	);
}

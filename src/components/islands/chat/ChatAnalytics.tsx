/**
 * ChatAnalytics component
 * Displays conversation analytics and insights
 */
import { calculateConversationAnalytics as calculateAnalytics } from '../../../lib/chat';
import type { ChatAnalyticsProps } from './types';

export function ChatAnalytics({
	show,
	messages,
	sessionStartTime,
	feedbackAnalytics,
}: ChatAnalyticsProps) {
	if (!show) return null;

	const analytics = calculateAnalytics(messages);
	const sessionDuration = Math.floor((Date.now() - sessionStartTime) / 60000);
	const healthyResponses = messages.filter(m => m.citationHealth === 'healthy').length;
	const warningResponses = messages.filter(m => m.citationHealth === 'warning').length;
	const errorResponses = messages.filter(m => m.citationHealth === 'error').length;
	const uniqueCollections = new Set<string>();
	messages.forEach(m => {
		m.sources?.forEach(s => {
			if (s.collection) uniqueCollections.add(s.collection);
		});
	});

	return (
		<div className="border-b border-border/20 bg-surface-subtle/20 px-4 py-3 text-xs text-foreground/70">
			<span className="mb-2 block uppercase tracking-wide text-foreground/50">Conversation Insights</span>

			{/* Core Metrics */}
			<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
				<div className="rounded-xl border border-border/30 px-3 py-2">
					<span className="block text-foreground/50">Messages</span>
					<span className="text-sm font-semibold text-foreground">{analytics.totalMessages}</span>
				</div>
				<div className="rounded-xl border border-border/30 px-3 py-2">
					<span className="block text-foreground/50">Avg Quality</span>
					<span className={`text-sm font-semibold ${
						analytics.avgQualityScore >= 80
							? 'text-success-emphasis'
							: analytics.avgQualityScore >= 60
							? 'text-warning-emphasis'
							: 'text-error-emphasis'
					}`}>
						{analytics.avgQualityScore > 0 ? `${Math.round(analytics.avgQualityScore)}/100` : 'N/A'}
					</span>
				</div>
				<div className="rounded-xl border border-border/30 px-3 py-2">
					<span className="block text-foreground/50">Session Time</span>
					<span className="text-sm font-semibold text-foreground">
						{sessionDuration < 1 ? '<1m' : `${sessionDuration}m`}
					</span>
				</div>
				<div className="rounded-xl border border-border/30 px-3 py-2">
					<span className="block text-foreground/50">Topics</span>
					<span className="text-sm font-semibold text-foreground">{uniqueCollections.size}</span>
				</div>
			</div>

			{/* Citation Health */}
			{(healthyResponses + warningResponses + errorResponses) > 0 && (
				<div className="mt-3 rounded-xl border border-border/30 p-3">
					<span className="block text-foreground/50 mb-2">Citation Health</span>
					<div className="flex flex-wrap gap-2">
						{healthyResponses > 0 && (
							<span className="inline-flex items-center gap-1 rounded-full bg-success-subtle px-2.5 py-1 text-[0.65rem] font-medium text-success-emphasis">
								<span>✓</span>
								{healthyResponses} Verified
							</span>
						)}
						{warningResponses > 0 && (
							<span className="inline-flex items-center gap-1 rounded-full bg-warning-subtle px-2.5 py-1 text-[0.65rem] font-medium text-warning-emphasis">
								<span>⚠</span>
								{warningResponses} Warnings
							</span>
						)}
						{errorResponses > 0 && (
							<span className="inline-flex items-center gap-1 rounded-full bg-error-subtle px-2.5 py-1 text-[0.65rem] font-medium text-error-emphasis">
								<span>✗</span>
								{errorResponses} Issues
							</span>
						)}
					</div>
				</div>
			)}

			{/* Topics Explored */}
			{uniqueCollections.size > 0 && (
				<div className="mt-3">
					<span className="block uppercase tracking-wide text-foreground/50 mb-2">Topics Explored</span>
					<div className="flex flex-wrap gap-1.5">
						{Array.from(uniqueCollections).map((collection) => (
							<span
								key={String(collection)}
								className="inline-flex items-center rounded-full bg-accent/10 px-2.5 py-1 text-[0.65rem] font-medium text-accent-emphasis"
							>
								{collection}
							</span>
						))}
					</div>
				</div>
			)}

			{/* Feedback Analytics */}
			{feedbackAnalytics.totalAssistant > 0 && (
				<div className="mt-3 border-t border-border/30 pt-3">
					<span className="block uppercase tracking-wide text-foreground/50 mb-2">User Feedback</span>
					<div className="flex flex-wrap gap-2">
						<div className="rounded-xl border border-border/30 px-3 py-2">
							<span className="block text-foreground/50">Helpful</span>
							<span className="text-sm font-semibold text-accent-emphasis">{feedbackAnalytics.positive}</span>
						</div>
						<div className="rounded-xl border border-border/30 px-3 py-2">
							<span className="block text-foreground/50">Needs work</span>
							<span className="text-sm font-semibold text-error-emphasis">{feedbackAnalytics.negative}</span>
						</div>
						{feedbackAnalytics.positiveRate !== null && (
							<div className="rounded-xl border border-border/30 px-3 py-2">
								<span className="block text-foreground/50">Satisfaction</span>
								<span className="text-sm font-semibold text-foreground">{feedbackAnalytics.positiveRate}%</span>
							</div>
						)}
					</div>
				</div>
			)}

			{/* Performance Metrics */}
			{analytics.avgResponseTimeMs > 0 && (
				<div className="mt-3 border-t border-border/30 pt-3">
					<span className="block uppercase tracking-wide text-foreground/50 mb-2">Performance</span>
					<div className="flex flex-wrap gap-2">
						<div className="rounded-xl border border-border/30 px-3 py-2">
							<span className="block text-foreground/50">Avg Response</span>
							<span className="text-sm font-semibold text-foreground">
								{(analytics.avgResponseTimeMs / 1000).toFixed(1)}s
							</span>
						</div>
						<div className="rounded-xl border border-border/30 px-3 py-2">
							<span className="block text-foreground/50">Fastest</span>
							<span className="text-sm font-semibold text-success-emphasis">
								{(analytics.avgResponseTimeMs / 1000).toFixed(1)}s
							</span>
						</div>
						<div className="rounded-xl border border-border/30 px-3 py-2">
							<span className="block text-foreground/50">Slowest</span>
							<span className="text-sm font-semibold text-warning-emphasis">
								{(analytics.avgResponseTimeMs / 1000).toFixed(1)}s
							</span>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

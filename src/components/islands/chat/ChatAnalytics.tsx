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
		<div className="border-b border-[color:var(--border)]/20 bg-[color:var(--surface-subtle)]/20 px-4 py-3 text-xs text-[color:var(--fg)]/70">
			<span className="mb-2 block uppercase tracking-wide text-[color:var(--fg)]/50">Conversation Insights</span>

			{/* Core Metrics */}
			<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
				<div className="rounded-xl border border-[color:var(--border)]/30 px-3 py-2">
					<span className="block text-[color:var(--fg)]/45">Messages</span>
					<span className="text-sm font-semibold text-[color:var(--fg)]">{analytics.totalMessages}</span>
				</div>
				<div className="rounded-xl border border-[color:var(--border)]/30 px-3 py-2">
					<span className="block text-[color:var(--fg)]/45">Avg Quality</span>
					<span className={`text-sm font-semibold ${
						analytics.avgQualityScore >= 80
							? 'text-green-600 dark:text-green-400'
							: analytics.avgQualityScore >= 60
							? 'text-yellow-600 dark:text-yellow-400'
							: 'text-red-600 dark:text-red-400'
					}`}>
						{analytics.avgQualityScore > 0 ? `${Math.round(analytics.avgQualityScore)}/100` : 'N/A'}
					</span>
				</div>
				<div className="rounded-xl border border-[color:var(--border)]/30 px-3 py-2">
					<span className="block text-[color:var(--fg)]/45">Session Time</span>
					<span className="text-sm font-semibold text-[color:var(--fg)]">
						{sessionDuration < 1 ? '<1m' : `${sessionDuration}m`}
					</span>
				</div>
				<div className="rounded-xl border border-[color:var(--border)]/30 px-3 py-2">
					<span className="block text-[color:var(--fg)]/45">Topics</span>
					<span className="text-sm font-semibold text-[color:var(--fg)]">{uniqueCollections.size}</span>
				</div>
			</div>

			{/* Citation Health */}
			{(healthyResponses + warningResponses + errorResponses) > 0 && (
				<div className="mt-3 rounded-xl border border-[color:var(--border)]/30 p-3">
					<span className="block text-[color:var(--fg)]/45 mb-2">Citation Health</span>
					<div className="flex flex-wrap gap-2">
						{healthyResponses > 0 && (
							<span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-1 text-[0.65rem] font-medium text-green-700 dark:text-green-300">
								<span>✓</span>
								{healthyResponses} Verified
							</span>
						)}
						{warningResponses > 0 && (
							<span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 px-2.5 py-1 text-[0.65rem] font-medium text-yellow-700 dark:text-yellow-300">
								<span>⚠</span>
								{warningResponses} Warnings
							</span>
						)}
						{errorResponses > 0 && (
							<span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-900/30 px-2.5 py-1 text-[0.65rem] font-medium text-red-700 dark:text-red-300">
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
					<span className="block uppercase tracking-wide text-[color:var(--fg)]/50 mb-2">Topics Explored</span>
					<div className="flex flex-wrap gap-1.5">
						{Array.from(uniqueCollections).map((collection) => (
							<span
								key={String(collection)}
								className="inline-flex items-center rounded-full bg-[color:var(--accent)]/10 px-2.5 py-1 text-[0.65rem] font-medium text-[color:var(--accent-strong)]"
							>
								{collection}
							</span>
						))}
					</div>
				</div>
			)}

			{/* Feedback Analytics */}
			{feedbackAnalytics.totalAssistant > 0 && (
				<div className="mt-3 border-t border-[color:var(--border)]/30 pt-3">
					<span className="block uppercase tracking-wide text-[color:var(--fg)]/50 mb-2">User Feedback</span>
					<div className="flex flex-wrap gap-2">
						<div className="rounded-xl border border-[color:var(--border)]/30 px-3 py-2">
							<span className="block text-[color:var(--fg)]/45">Helpful</span>
							<span className="text-sm font-semibold text-[color:var(--accent-strong)]">{feedbackAnalytics.positive}</span>
						</div>
						<div className="rounded-xl border border-[color:var(--border)]/30 px-3 py-2">
							<span className="block text-[color:var(--fg)]/45">Needs work</span>
							<span className="text-sm font-semibold text-red-500 dark:text-red-300">{feedbackAnalytics.negative}</span>
						</div>
						{feedbackAnalytics.positiveRate !== null && (
							<div className="rounded-xl border border-[color:var(--border)]/30 px-3 py-2">
								<span className="block text-[color:var(--fg)]/45">Satisfaction</span>
								<span className="text-sm font-semibold text-[color:var(--fg)]">{feedbackAnalytics.positiveRate}%</span>
							</div>
						)}
					</div>
				</div>
			)}

			{/* Performance Metrics */}
			{analytics.avgResponseTimeMs > 0 && (
				<div className="mt-3 border-t border-[color:var(--border)]/30 pt-3">
					<span className="block uppercase tracking-wide text-[color:var(--fg)]/50 mb-2">Performance</span>
					<div className="flex flex-wrap gap-2">
						<div className="rounded-xl border border-[color:var(--border)]/30 px-3 py-2">
							<span className="block text-[color:var(--fg)]/45">Avg Response</span>
							<span className="text-sm font-semibold text-[color:var(--fg)]">
								{(analytics.avgResponseTimeMs / 1000).toFixed(1)}s
							</span>
						</div>
						<div className="rounded-xl border border-[color:var(--border)]/30 px-3 py-2">
							<span className="block text-[color:var(--fg)]/45">Fastest</span>
							<span className="text-sm font-semibold text-green-600 dark:text-green-400">
								{(analytics.avgResponseTimeMs / 1000).toFixed(1)}s
							</span>
						</div>
						<div className="rounded-xl border border-[color:var(--border)]/30 px-3 py-2">
							<span className="block text-[color:var(--fg)]/45">Slowest</span>
							<span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
								{(analytics.avgResponseTimeMs / 1000).toFixed(1)}s
							</span>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

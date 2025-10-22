/**
 * Analytics utility for Plausible tracking
 * Provides type-safe event tracking with automatic error handling
 */

interface PlausibleWindow {
	plausible?: (event: string, options?: { props?: Record<string, string | number | boolean> }) => void;
}

/**
 * Track an analytics event with Plausible
 * @param event - Event name to track
 * @param props - Optional properties to attach to the event
 */
export function trackEvent(
	event: string,
	props?: Record<string, string | number | boolean>
): void {
	try {
		const win = window as unknown as PlausibleWindow;
		if (win.plausible) {
			win.plausible(event, props ? { props } : undefined);
		}
	} catch (error) {
		// Silently fail - analytics should never break functionality
		console.debug('Analytics tracking failed:', error);
	}
}

/**
 * Common AutoRAG event tracking helpers
 */
export const autoragEvents = {
	qualityScore: (data: {
		overall_score: number;
		completeness?: number;
		citation_accuracy?: number;
		conciseness?: number;
		relevance?: number;
		source_count?: number;
		word_count?: number;
		citation_health?: string;
		response_time_ms?: number;
	}) => trackEvent('AutoRAG Quality Score', data),

	chatInsights: (data: {
		total_messages: number;
		user_messages: number;
		assistant_messages: number;
		total_sources: number;
		avg_response_time_ms?: number;
		avg_quality_score?: number;
	}) => trackEvent('Chat Insights', data),

	export: (format: 'markdown' | 'json') =>
		trackEvent('AutoRAG Export', { format }),

	errorRetry: (data: {
		category: string;
		attempt: number;
		user_initiated?: boolean;
	}) => trackEvent('AutoRAG Error Retry', data),

	error: (data: {
		category: string;
		severity: string;
		message?: string;
		retry_available?: boolean;
	}) => trackEvent('AutoRAG Error', data),

	quickAction: (data: { action: string; category?: string }) =>
		trackEvent('AutoRAG Quick Action', data),

	ctaClick: (data: { type: string; label: string; source?: string }) =>
		trackEvent('AutoRAG CTA Click', data),

	suggestedQuery: (data: { query: string; position?: number }) =>
		trackEvent('AutoRAG Suggested Query', data),

	share: (method: 'native' | 'clipboard') =>
		trackEvent('AutoRAG Share', { method }),

	manualRetry: (data: { error_category?: string; message_id: string }) =>
		trackEvent('AutoRAG Manual Retry', data),
};

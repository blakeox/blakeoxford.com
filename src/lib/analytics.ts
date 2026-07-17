/**
 * Analytics utility routed through Cloudflare Zaraz.
 * Falls back to dataLayer/gtag when Zaraz compatibility mode is active.
 * Custom events are mirrored to Microsoft Clarity (name + key tags).
 */

import { setClarityTags, trackClarityEvent } from './clarity';

export type AnalyticsProps = Record<string, string | number | boolean>;

interface ZarazClient {
	track?: (event: string, props?: Record<string, unknown>) => void | Promise<void>;
}

interface DataLayerWindow {
	dataLayer?: Array<Record<string, unknown>>;
}

const CLARITY_TAG_KEYS = new Set([
	'source',
	'mode',
	'backend',
	'provider',
	'cache_status',
	'complexity',
	'kind',
	'format',
	'category',
	'severity',
	'action',
	'type',
	'method',
	'metric_name',
	'metric_rating',
	'navigation_type',
	'result_count',
	'query_length',
	'semantic_hit_count',
]);

function mirrorToClarity(event: string, props?: AnalyticsProps): void {
	trackClarityEvent(event);
	if (!props) return;

	const tags: Record<string, string> = {};
	for (const [key, value] of Object.entries(props)) {
		if (!CLARITY_TAG_KEYS.has(key)) continue;
		tags[key] = String(value);
	}
	if (Object.keys(tags).length > 0) {
		setClarityTags(tags);
	}
}

/**
 * Track an analytics event via Zaraz (preferred) or legacy shims.
 */
export function trackEvent(event: string, props?: AnalyticsProps): void {
	try {
		const win = window as Window &
			DataLayerWindow & {
				zaraz?: ZarazClient;
				gtag?: (...args: unknown[]) => void;
			};

		if (win.zaraz?.track) {
			void win.zaraz.track(event, props);
		} else if (Array.isArray(win.dataLayer)) {
			win.dataLayer.push({ event, ...props });
		} else if (typeof win.gtag === 'function') {
			win.gtag('event', event, props);
		}

		mirrorToClarity(event, props);
	} catch (error) {
		// Analytics should never break functionality
		console.debug('Analytics tracking failed:', error);
	}
}

/** High-intent conversion events (GA4-friendly snake_case). */
export const conversionEvents = {
	generateLead: (data?: { method?: string; form?: string }) =>
		trackEvent('generate_lead', {
			method: data?.method ?? 'contact_form',
			form: data?.form ?? 'contact',
		}),

	chatEngagement: (data: { user_messages: number; total_messages: number }) =>
		trackEvent('chat_engagement', data),
};

/**
 * AutoRAG / AI chat product events
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
	}) => trackEvent('autorag_quality_score', data),

	chatInsights: (data: {
		total_messages: number;
		user_messages: number;
		assistant_messages: number;
		total_sources: number;
		avg_response_time_ms?: number;
		avg_quality_score?: number;
	}) => trackEvent('chat_insights', data),

	export: (format: 'markdown' | 'json') => trackEvent('autorag_export', { format }),

	errorRetry: (data: { category: string; attempt: number; user_initiated?: boolean }) =>
		trackEvent('autorag_error_retry', data),

	error: (data: {
		category: string;
		severity: string;
		message?: string;
		retry_available?: boolean;
	}) => trackEvent('autorag_error', data),

	quickAction: (data: { action: string; category?: string }) =>
		trackEvent('autorag_quick_action', data),

	ctaClick: (data: { type: string; label: string; source?: string }) =>
		trackEvent('autorag_cta_click', data),

	suggestedQuery: (data: { query: string; position?: number }) =>
		trackEvent('autorag_suggested_query', {
			query_length: data.query.length,
			position: data.position ?? 0,
		}),

	share: (method: 'native' | 'clipboard') => trackEvent('autorag_share', { method }),

	manualRetry: (data: { error_category?: string; message_id: string }) =>
		trackEvent('autorag_manual_retry', {
			error_category: data.error_category ?? 'unknown',
			message_id: data.message_id,
		}),

	feedback: (data: { sentiment: 'positive' | 'negative'; message_id: string }) =>
		trackEvent('autorag_feedback', data),

	responseMeta: (data: {
		provider: string;
		cache_status: string;
		complexity: string;
	}) => trackEvent('autorag_response_meta', data),
};

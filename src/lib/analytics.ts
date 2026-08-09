/**
 * Analytics utility routed through Cloudflare Zaraz.
 * Falls back to dataLayer/gtag when Zaraz compatibility mode is active.
 * Custom events are mirrored to Microsoft Clarity (name + key tags).
 */

import { setClarityTags, trackClarityEvent } from './clarity';

export type AnalyticsProps = Record<string, string | number | boolean>;

const BLOCKED_ANALYTICS_KEYS = new Set([
  'email',
  'href',
  'ip',
  'message',
  'message_id',
  'metric_id',
  'name',
  'password',
  'prompt',
  'query',
  'referrer',
  'response',
  'session_id',
  'token',
  'url',
  'user_id',
]);

const MAX_ANALYTICS_KEY_LENGTH = 40;
const MAX_ANALYTICS_STRING_LENGTH = 100;

interface ZarazClient {
  track?: (event: string, props?: Record<string, unknown>) => void | Promise<void>;
}

interface DataLayerWindow {
  dataLayer?: Array<Record<string, unknown>>;
}

const CLARITY_TAG_KEYS = new Set([
  'source',
  'acquisition_source',
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

export type AcquisitionSource = 'organic' | 'referral' | 'direct' | 'internal' | 'unknown';

const SEARCH_ENGINE_HOSTS = new Set([
  'baidu.com',
  'bing.com',
  'brave.com',
  'duckduckgo.com',
  'ecosia.org',
  'google.com',
  'search.yahoo.com',
  'yandex.com',
]);

function isSearchEngineHost(hostname: string): boolean {
  return (
    SEARCH_ENGINE_HOSTS.has(hostname) ||
    [...SEARCH_ENGINE_HOSTS].some((host) => hostname.endsWith(`.${host}`)) ||
    hostname.startsWith('google.') ||
    hostname.startsWith('search.yahoo.') ||
    hostname.startsWith('yandex.')
  );
}

/**
 * Classify acquisition without retaining the referrer URL or its query string.
 * The host list is deliberately bounded so analytics receives a low-cardinality value.
 */
export function classifyAcquisitionSource(referrer: string): AcquisitionSource {
  const value = referrer.trim();
  if (!value) return 'direct';

  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return 'unknown';

    const hostname = url.hostname.toLowerCase().replace(/^www\./, '');
    if (hostname === 'blakeoxford.com') return 'internal';
    if (isSearchEngineHost(hostname)) {
      return 'organic';
    }
    return 'referral';
  } catch {
    return 'unknown';
  }
}

export function getAcquisitionSource(): AcquisitionSource {
  return typeof document === 'undefined' ? 'unknown' : classifyAcquisitionSource(document.referrer);
}

/**
 * Keep analytics payloads bounded and free of direct identifiers or content.
 * This is intentionally applied at the shared boundary so new callers inherit
 * the same privacy contract without depending on each vendor's configuration.
 */
export function sanitizeAnalyticsProps(props?: AnalyticsProps): AnalyticsProps | undefined {
  if (!props) return undefined;

  const safeProps: AnalyticsProps = {};
  for (const [key, value] of Object.entries(props)) {
    if (
      !key ||
      key.length > MAX_ANALYTICS_KEY_LENGTH ||
      BLOCKED_ANALYTICS_KEYS.has(key.toLowerCase())
    ) {
      continue;
    }

    if (typeof value === 'string') {
      const normalized = [...value]
        .filter((character) => {
          const code = character.charCodeAt(0);
          return (code >= 0x20 && code !== 0x7f) || code === 0x09;
        })
        .join('')
        .trim();
      if (normalized) safeProps[key] = normalized.slice(0, MAX_ANALYTICS_STRING_LENGTH);
      continue;
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      safeProps[key] = value;
      continue;
    }

    if (typeof value === 'boolean') safeProps[key] = value;
  }

  return Object.keys(safeProps).length > 0 ? safeProps : undefined;
}

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
    const safeProps = sanitizeAnalyticsProps(props);
    const win = window as Window &
      DataLayerWindow & {
        zaraz?: ZarazClient;
        gtag?: (...args: unknown[]) => void;
      };

    if (win.zaraz?.track) {
      void win.zaraz.track(event, safeProps);
    } else if (Array.isArray(win.dataLayer)) {
      win.dataLayer.push({ event, ...safeProps });
    } else if (typeof win.gtag === 'function') {
      win.gtag('event', event, safeProps);
    } else {
      // Queue events for a late-loaded Zaraz/dataLayer integration.
      win.dataLayer = [];
      win.dataLayer.push({ event, ...safeProps });
    }

    mirrorToClarity(event, safeProps);
  } catch (error) {
    // Analytics should never break functionality
    console.debug('Analytics tracking failed:', error);
  }
}

/** High-intent conversion events (GA4-friendly snake_case). */
export const conversionEvents = {
  generateLead: (data?: {
    method?: string;
    form?: string;
    acquisition_source?: AcquisitionSource;
  }) => {
    const props: AnalyticsProps = {
      method: data?.method ?? 'contact_form',
      form: data?.form ?? 'contact',
    };
    if (data?.acquisition_source) props.acquisition_source = data.acquisition_source;
    trackEvent('generate_lead', props);
  },

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

  error: (data: { category: string; severity: string; retry_available?: boolean }) =>
    trackEvent('autorag_error', data),

  quickAction: (data: { action: string; category?: string }) =>
    trackEvent('autorag_quick_action', data),

  ctaClick: (data: { type: string; label: string }) => trackEvent('autorag_cta_click', data),

  suggestedQuery: (data: { query: string; position?: number }) =>
    trackEvent('autorag_suggested_query', {
      query_length: data.query.length,
      position: data.position ?? 0,
    }),

  share: (method: 'native' | 'clipboard') => trackEvent('autorag_share', { method }),

  manualRetry: () => trackEvent('autorag_manual_retry', { error_category: 'unknown' }),

  feedback: (data: { sentiment: 'positive' | 'negative' }) => trackEvent('autorag_feedback', data),

  responseMeta: (data: { provider: string; cache_status: string; complexity: string }) =>
    trackEvent('autorag_response_meta', data),
};

import { tracing } from 'cloudflare:workers';

type AskSpanAttributes = {
  provider: string;
  cacheStatus: string;
  latencyMs: number;
};

/**
 * Annotate the invocation root span. Attributes stay limited to provider,
 * cache status, and latency so prompts and answers never enter traces.
 */
export function annotateAskSpan({ provider, cacheStatus, latencyMs }: AskSpanAttributes): void {
  try {
    tracing.getActiveSpan()?.setAttributes({
      'ask.provider': provider,
      'ask.cache_status': cacheStatus,
      'ask.latency_ms': latencyMs,
    });
  } catch {
    // Tracing is best-effort and absent outside the Workers runtime.
  }
}

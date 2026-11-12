// Sentry 11 enables payload collection by default. Keep diagnostics free of
// request payloads, identifiers, and Ask inputs/outputs in both runtimes.
export const sentryDataCollection = {
  userInfo: false,
  cookies: false,
  httpHeaders: { request: false, response: false },
  httpBodies: [] as Array<
    'incomingRequest' | 'outgoingRequest' | 'incomingResponse' | 'outgoingResponse'
  >,
  urlQueryParams: false,
  genAI: { inputs: false, outputs: false },
  databaseQueryData: false,
  queues: false,
  graphQL: { document: false, variables: false },
};

/**
 * Prefer the Workers Build env, then hostname, then Vite MODE.
 * Preview production builds still use MODE=production; hostname keeps
 * workers.dev hosts on preview allowed URLs when the build env is missing.
 */
export function resolveBrowserSentryEnvironment(options: {
  configured?: string;
  mode?: string;
  hostname?: string;
}): string {
  if (options.configured) return options.configured;

  const hostname = options.hostname ?? '';
  if (/(?:^|\.)blakeoxford\.workers\.dev$/i.test(hostname)) return 'preview';
  if (/^(?:www\.)?blakeoxford\.com$/i.test(hostname)) return 'production';

  return options.mode || 'development';
}

/** Restrict reports and trace headers to this site's owned deployments. */
export function createSentryAllowedUrls(environment: string) {
  const production = /^https:\/\/(?:www\.)?blakeoxford\.com(?:\/|$)/i;
  if (environment === 'preview') {
    return [
      production,
      /^https:\/\/[a-z0-9-]+-blakeoxford-com\.blakeoxford\.workers\.dev(?:\/|$)/i,
    ];
  }
  if (environment === 'verification') {
    return [production, /^http:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?(?:\/|$)/i];
  }
  return [production];
}

export function scrubSentrySpan<T extends { attributes?: Record<string, unknown> }>(span: T): T {
  // These semantic attributes bypass the SDK's HTTP-header collection policy.
  if (span.attributes) {
    delete span.attributes['user_agent.original'];
    delete span.attributes['http.user_agent'];
  }
  return span;
}

interface SamplingContext {
  attributes?: Record<string, unknown>;
  normalizedRequest?: { headers?: Record<string, unknown> };
  inheritOrSampleWith: (rate: number) => number;
}

export function createSentrySampler(rate: number, browserUserAgent = () => '') {
  return (context: SamplingContext) => {
    const userAgent =
      context.attributes?.['user_agent.original'] ||
      context.normalizedRequest?.headers?.['user-agent'] ||
      browserUserAgent();
    if (
      /bot|crawler|spider|headless|lighthouse|gtmetrix|pagespeed|uptimerobot/i.test(
        String(userAgent)
      )
    ) {
      return 0;
    }
    return context.inheritOrSampleWith(rate);
  };
}

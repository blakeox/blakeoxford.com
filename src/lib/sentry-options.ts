// Sentry 11 enables payload collection by default. Keep diagnostics free of
// request payloads, identifiers, and Ask inputs/outputs in both runtimes.
export const sentryDataCollection = {
  userInfo: false,
  cookies: false,
  httpHeaders: false,
  httpBodies: [],
  urlQueryParams: false,
  genAI: { inputs: false, outputs: false },
  databaseQueryData: false,
  queues: false,
  graphQL: { document: false, variables: false },
};

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

export function scrubSentrySpan<T extends { attributes: Record<string, unknown> }>(span: T): T {
  // These semantic attributes bypass the SDK's HTTP-header collection policy.
  delete span.attributes['user_agent.original'];
  delete span.attributes['http.user_agent'];
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

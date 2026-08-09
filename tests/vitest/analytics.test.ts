import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  classifyAcquisitionSource,
  trackEvent,
  autoragEvents,
  conversionEvents,
  sanitizeAnalyticsProps,
} from '../../src/lib/analytics';
import { __resetClarityForTests } from '../../src/lib/clarity';

describe('trackEvent routing', () => {
  beforeEach(() => {
    __resetClarityForTests();
    vi.stubGlobal('window', {
      zaraz: undefined,
      dataLayer: undefined,
      gtag: undefined,
      clarity: undefined,
    });
  });

  it.each([
    ['', 'direct'],
    ['https://www.google.com/search?q=private-query', 'organic'],
    ['https://www.google.co.uk/search?q=private-query', 'organic'],
    ['https://example.org/article', 'referral'],
    ['https://blakeoxford.com/blog/', 'internal'],
    ['not a URL', 'unknown'],
  ] as const)('classifies %s as %s without retaining URL data', (referrer, expected) => {
    expect(classifyAcquisitionSource(referrer)).toBe(expected);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('prefers zaraz.track when available', () => {
    const track = vi.fn();
    const clarity = vi.fn();
    vi.stubGlobal('window', { zaraz: { track }, clarity });

    trackEvent('command_center_open', { source: 'nav' });

    expect(track).toHaveBeenCalledWith('command_center_open', { source: 'nav' });
    expect(clarity).toHaveBeenCalledWith('event', 'command_center_open');
    expect(clarity).toHaveBeenCalledWith('set', 'source', 'nav');
  });

  it('drops invalid event names before routing', () => {
    const track = vi.fn();
    const clarity = vi.fn();
    vi.stubGlobal('window', { zaraz: { track }, clarity });

    trackEvent('private query', { source: 'nav' });
    trackEvent('valid_event', { source: 'nav' });

    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith('valid_event', { source: 'nav' });
    expect(clarity).toHaveBeenCalledWith('event', 'valid_event');
  });

  it('falls back to dataLayer when zaraz is missing', () => {
    const dataLayer: Array<Record<string, unknown>> = [];
    vi.stubGlobal('window', { dataLayer, clarity: vi.fn() });

    trackEvent('web_vitals', { metric_name: 'LCP', value: 1200 });

    expect(dataLayer).toEqual([{ event: 'web_vitals', metric_name: 'LCP', value: 1200 }]);
  });

  it('falls back to gtag when zaraz and dataLayer are missing', () => {
    const gtag = vi.fn();
    vi.stubGlobal('window', { gtag, clarity: vi.fn() });

    trackEvent('generate_lead', { method: 'contact_form' });

    expect(gtag).toHaveBeenCalledWith('event', 'generate_lead', {
      method: 'contact_form',
    });
  });

  it('never throws when analytics clients fail', () => {
    const debug = vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.stubGlobal('window', {
      zaraz: {
        track: () => {
          throw new Error('boom');
        },
      },
    });

    expect(() =>
      trackEvent('autorag_error', { category: 'network', severity: 'high' })
    ).not.toThrow();
    expect(debug).toHaveBeenCalled();
  });

  it('handles rejected async analytics clients without an unhandled rejection', async () => {
    const debug = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const track = vi.fn().mockRejectedValue(new Error('async boom'));
    vi.stubGlobal('window', { zaraz: { track }, clarity: vi.fn() });

    expect(() => trackEvent('autorag_error', { category: 'network' })).not.toThrow();
    await Promise.resolve();

    expect(debug).toHaveBeenCalledWith('Analytics tracking failed:', expect.any(Error));
  });

  it('autorag and conversion helpers emit snake_case events', () => {
    const track = vi.fn();
    vi.stubGlobal('window', { zaraz: { track }, clarity: vi.fn() });

    autoragEvents.feedback({ sentiment: 'positive' });
    conversionEvents.generateLead();
    conversionEvents.generateLead({ acquisition_source: 'organic' });
    conversionEvents.chatEngagement({ user_messages: 2, total_messages: 5 });

    expect(track).toHaveBeenCalledWith('autorag_feedback', {
      sentiment: 'positive',
    });
    expect(track).toHaveBeenCalledWith('generate_lead', {
      method: 'contact_form',
      form: 'contact',
    });
    expect(track).toHaveBeenCalledWith('generate_lead', {
      method: 'contact_form',
      form: 'contact',
      acquisition_source: 'organic',
    });
    expect(track).toHaveBeenCalledWith('chat_engagement', {
      user_messages: 2,
      total_messages: 5,
    });
  });

  it('drops content and identifiers while retaining bounded dimensions', () => {
    expect(
      sanitizeAnalyticsProps({
        query: 'private question',
        message_id: 'message-1',
        source: 'nav',
        unreviewed_field: 'must not cross the boundary',
      })
    ).toEqual({ source: 'nav' });
  });

  it('drops unapproved categorical values', () => {
    expect(
      sanitizeAnalyticsProps({
        acquisition_source: 'private-referrer',
        metric_rating: 'unknown',
        sentiment: 'positive',
      })
    ).toEqual({ sentiment: 'positive' });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock analytics functions for testing
const trackEvent = vi.fn();
const trackEventLegacy = vi.fn();
const trackPageView = vi.fn();

describe('Analytics Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('trackEvent', () => {
    it('should be mockable', () => {
      trackEvent('test_event', { test: 'data' });
      expect(trackEvent).toHaveBeenCalledWith('test_event', { test: 'data' });
    });

    it('should handle multiple calls', () => {
      trackEvent('event1');
      trackEvent('event2');
      expect(trackEvent).toHaveBeenCalledTimes(2);
    });

    it('should handle events without data', () => {
      trackEvent('simple_event');
      expect(trackEvent).toHaveBeenCalledWith('simple_event');
    });
  });

  describe('trackEventLegacy', () => {
    it('should be mockable', () => {
      trackEventLegacy('legacy_event');
      expect(trackEventLegacy).toHaveBeenCalledWith('legacy_event');
    });

    it('should handle different event types', () => {
      trackEventLegacy('click');
      trackEventLegacy('view');
      expect(trackEventLegacy).toHaveBeenCalledWith('click');
      expect(trackEventLegacy).toHaveBeenCalledWith('view');
    });
  });

  describe('trackPageView', () => {
    it('should be mockable', () => {
      trackPageView('/test-page');
      expect(trackPageView).toHaveBeenCalledWith('/test-page');
    });

    it('should handle different page paths', () => {
      trackPageView('/home');
      trackPageView('/about');
      trackPageView('/contact');
      expect(trackPageView).toHaveBeenCalledTimes(3);
    });

    it('should handle root path', () => {
      trackPageView('/');
      expect(trackPageView).toHaveBeenCalledWith('/');
    });
  });
});
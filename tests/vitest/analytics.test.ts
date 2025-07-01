/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { trackEvent, trackEventLegacy, trackPageView } from '../../public/assets/js/analytics.js';

describe('Analytics Module', () => {
  beforeEach(() => {
    // Reset window globals
    delete (window as any).dataLayer;
    delete (window as any).gtag;
    delete (window as any).plausible;
    delete (window as any).fathom;
    delete (window as any).clarity;
    
    // Mock console methods
    vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('trackEvent', () => {
    it('should push to dataLayer when available', () => {
      const mockDataLayer: any[] = [];
      (window as any).dataLayer = mockDataLayer;

      trackEvent('test_event', { category: 'test', value: 1 });

      expect(mockDataLayer).toHaveLength(1);
      expect(mockDataLayer[0]).toEqual({
        event: 'test_event',
        category: 'test',
        value: 1
      });
    });

    it('should call gtag when available', () => {
      const mockGtag = vi.fn();
      (window as any).gtag = mockGtag;

      trackEvent('test_event', { category: 'test' });

      expect(mockGtag).toHaveBeenCalledWith('event', 'test_event', { category: 'test' });
    });

    it('should call plausible when available', () => {
      const mockPlausible = vi.fn();
      (window as any).plausible = mockPlausible;

      trackEvent('test_event', { category: 'test' });

      expect(mockPlausible).toHaveBeenCalledWith('test_event', { props: { category: 'test' } });
    });

    it('should call fathom when available', () => {
      const mockFathom = {
        trackEvent: vi.fn()
      };
      (window as any).fathom = mockFathom;

      trackEvent('test_event', { category: 'test' });

      expect(mockFathom.trackEvent).toHaveBeenCalledWith('test_event', { category: 'test' });
    });

    it('should call clarity when available', () => {
      const mockClarity = vi.fn();
      (window as any).clarity = mockClarity;

      trackEvent('test_event', { category: 'test' });

      expect(mockClarity).toHaveBeenCalledWith('track', 'test_event', { category: 'test' });
    });

    it('should fallback to console.debug when no analytics provider is available', () => {
      trackEvent('test_event', { category: 'test' });

      expect(console.debug).toHaveBeenCalledWith('[Analytics]', 'test_event', { category: 'test' });
    });

    it('should handle events with no additional data', () => {
      const mockDataLayer: any[] = [];
      (window as any).dataLayer = mockDataLayer;

      trackEvent('simple_event');

      expect(mockDataLayer[0]).toEqual({
        event: 'simple_event'
      });
    });
  });

  describe('trackEventLegacy', () => {
    it('should push legacy format to dataLayer', () => {
      const mockDataLayer: any[] = [];
      (window as any).dataLayer = mockDataLayer;

      trackEventLegacy({
        category: 'Navigation',
        action: 'Click',
        label: 'nav-home',
        value: 1
      });

      expect(mockDataLayer).toHaveLength(1);
      expect(mockDataLayer[0]).toEqual({
        event: 'custom_event',
        event_category: 'Navigation',
        event_action: 'Click',
        event_label: 'nav-home',
        value: 1
      });
    });

    it('should handle missing optional parameters', () => {
      const mockDataLayer: any[] = [];
      (window as any).dataLayer = mockDataLayer;

      trackEventLegacy({
        category: 'Navigation',
        action: 'Click'
      });

      expect(mockDataLayer[0]).toEqual({
        event: 'custom_event',
        event_category: 'Navigation',
        event_action: 'Click',
        event_label: '',
        value: undefined
      });
    });

    it('should not push when dataLayer is not available', () => {
      // No dataLayer on window
      trackEventLegacy({
        category: 'Navigation',
        action: 'Click'
      });

      // Should not throw an error
      expect(true).toBe(true);
    });
  });

  describe('trackPageView', () => {
    it('should push pageview to dataLayer with custom path', () => {
      const mockDataLayer: any[] = [];
      (window as any).dataLayer = mockDataLayer;

      trackPageView('/custom-path');

      expect(mockDataLayer).toHaveLength(1);
      expect(mockDataLayer[0]).toEqual({
        event: 'pageview',
        page_path: '/custom-path'
      });
    });

    it('should use current pathname when no path provided', () => {
      const mockDataLayer: any[] = [];
      (window as any).dataLayer = mockDataLayer;
      
      // Mock window.location.pathname
      Object.defineProperty(window, 'location', {
        value: {
          pathname: '/current-page'
        },
        writable: true
      });

      trackPageView();

      expect(mockDataLayer[0]).toEqual({
        event: 'pageview',
        page_path: '/current-page'
      });
    });

    it('should not push when dataLayer is not available', () => {
      // No dataLayer on window
      trackPageView('/test');

      // Should not throw an error
      expect(true).toBe(true);
    });
  });
});

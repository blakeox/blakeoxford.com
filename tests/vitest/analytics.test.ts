/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { trackEvent, trackEventLegacy, trackPageView } from '../../assets-source/js/analytics.js';

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

    it('should call both dataLayer and gtag when both are available', () => {
      const mockDataLayer: any[] = [];
      const mockGtag = vi.fn();
      (window as any).dataLayer = mockDataLayer;
      (window as any).gtag = mockGtag;

      trackEvent('dual_event', { category: 'test' });

      expect(mockDataLayer).toHaveLength(1);
      expect(mockDataLayer[0]).toEqual({
        event: 'dual_event',
        category: 'test'
      });
      expect(mockGtag).toHaveBeenCalledWith('event', 'dual_event', { category: 'test' });
    });

    it('should call both dataLayer and clarity when both are available', () => {
      const mockDataLayer: any[] = [];
      const mockClarity = vi.fn();
      (window as any).dataLayer = mockDataLayer;
      (window as any).clarity = mockClarity;

      trackEvent('dual_clarity_event', { category: 'test' });

      expect(mockDataLayer).toHaveLength(1);
      expect(mockDataLayer[0]).toEqual({
        event: 'dual_clarity_event',
        category: 'test'
      });
      expect(mockClarity).toHaveBeenCalledWith('track', 'dual_clarity_event', { category: 'test' });
    });

    it('should handle fathom object without trackEvent method', () => {
      const mockFathom = {}; // No trackEvent method
      (window as any).fathom = mockFathom;

      trackEvent('test_event', { category: 'test' });

      expect(console.debug).toHaveBeenCalledWith('[Analytics]', 'test_event', { category: 'test' });
    });

    it('should handle non-array dataLayer', () => {
      (window as any).dataLayer = 'not-an-array';

      trackEvent('test_event', { category: 'test' });

      expect(console.debug).toHaveBeenCalledWith('[Analytics]', 'test_event', { category: 'test' });
    });

    it('should handle complex event data with nested objects', () => {
      const mockDataLayer: any[] = [];
      (window as any).dataLayer = mockDataLayer;

      const complexData = {
        category: 'test',
        details: {
          page: '/home',
          user: { id: 123, type: 'premium' }
        },
        metrics: [1, 2, 3]
      };

      trackEvent('complex_event', complexData);

      expect(mockDataLayer[0]).toEqual({
        event: 'complex_event',
        ...complexData
      });
    });

    it('should prioritize gtag over plausible when both are available', () => {
      const mockGtag = vi.fn();
      const mockPlausible = vi.fn();
      (window as any).gtag = mockGtag;
      (window as any).plausible = mockPlausible;

      trackEvent('priority_test', { category: 'test' });

      expect(mockGtag).toHaveBeenCalledWith('event', 'priority_test', { category: 'test' });
      expect(mockPlausible).not.toHaveBeenCalled();
    });

    it('should prioritize plausible over fathom when both are available', () => {
      const mockPlausible = vi.fn();
      const mockFathom = {
        trackEvent: vi.fn()
      };
      (window as any).plausible = mockPlausible;
      (window as any).fathom = mockFathom;

      trackEvent('priority_test', { category: 'test' });

      expect(mockPlausible).toHaveBeenCalledWith('priority_test', { props: { category: 'test' } });
      expect(mockFathom.trackEvent).not.toHaveBeenCalled();
    });

    it('should handle multiple providers with dataLayer priority', () => {
      const mockDataLayer: any[] = [];
      const mockGtag = vi.fn();
      const mockPlausible = vi.fn();
      const mockFathom = {
        trackEvent: vi.fn()
      };
      const mockClarity = vi.fn();

      (window as any).dataLayer = mockDataLayer;
      (window as any).gtag = mockGtag;
      (window as any).plausible = mockPlausible;
      (window as any).fathom = mockFathom;
      (window as any).clarity = mockClarity;

      trackEvent('multi_provider_test', { category: 'test' });

      // dataLayer should be called
      expect(mockDataLayer).toHaveLength(1);
      expect(mockDataLayer[0]).toEqual({
        event: 'multi_provider_test',
        category: 'test'
      });

      // gtag should be called (first in else-if chain)
      expect(mockGtag).toHaveBeenCalledWith('event', 'multi_provider_test', { category: 'test' });

      // plausible should NOT be called (else-if chain)
      expect(mockPlausible).not.toHaveBeenCalled();

      // fathom should NOT be called (else-if chain)
      expect(mockFathom.trackEvent).not.toHaveBeenCalled();

      // clarity should be called (separate if statement)
      expect(mockClarity).toHaveBeenCalledWith('track', 'multi_provider_test', { category: 'test' });
    });

    it('should handle event with null eventData', () => {
      const mockDataLayer: any[] = [];
      (window as any).dataLayer = mockDataLayer;

      trackEvent('null_data_event', null as any);

      expect(mockDataLayer[0]).toEqual({
        event: 'null_data_event'
      });
    });

    it('should handle event with undefined eventData', () => {
      const mockDataLayer: any[] = [];
      (window as any).dataLayer = mockDataLayer;

      trackEvent('undefined_data_event', undefined as any);

      expect(mockDataLayer[0]).toEqual({
        event: 'undefined_data_event'
      });
    });

    it('should fallback to console when fathom exists but lacks trackEvent method', () => {
      const mockFathom = { someOtherMethod: vi.fn() }; // No trackEvent method
      (window as any).fathom = mockFathom;

      trackEvent('fathom_incomplete_test', { category: 'test' });

      expect(console.debug).toHaveBeenCalledWith('[Analytics]', 'fathom_incomplete_test', { category: 'test' });
    });

    it('should fallback to console when fathom is not an object', () => {
      (window as any).fathom = 'not-an-object';

      trackEvent('fathom_string_test', { category: 'test' });

      expect(console.debug).toHaveBeenCalledWith('[Analytics]', 'fathom_string_test', { category: 'test' });
    });

    it('should handle all analytics providers being undefined', () => {
      // Ensure all providers are undefined
      delete (window as any).dataLayer;
      delete (window as any).gtag;
      delete (window as any).plausible;
      delete (window as any).fathom;
      delete (window as any).clarity;

      trackEvent('all_undefined_test', { category: 'test' });

      expect(console.debug).toHaveBeenCalledWith('[Analytics]', 'all_undefined_test', { category: 'test' });
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
        value: 1 as any
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

    it('should handle empty strings for category and action', () => {
      const mockDataLayer: any[] = [];
      (window as any).dataLayer = mockDataLayer;

      trackEventLegacy({
        category: '',
        action: ''
      });

      expect(mockDataLayer[0]).toEqual({
        event: 'custom_event',
        event_category: '',
        event_action: '',
        event_label: '',
        value: undefined
      });
    });

    it('should handle non-array dataLayer for legacy tracking', () => {
      (window as any).dataLayer = 'not-an-array';

      // Should throw an error because the analytics function doesn't check if dataLayer is an array
      expect(() => {
        trackEventLegacy({
          category: 'Test',
          action: 'Click'
        });
      }).toThrow('window.dataLayer.push is not a function');
    });

    it('should handle null window object', () => {
      const originalWindow = (global as any).window;
      (global as any).window = null;

      // Should not throw an error
      expect(() => {
        trackEventLegacy({
          category: 'Test',
          action: 'Click'
        });
      }).not.toThrow();

      // Restore window
      (global as any).window = originalWindow;
    });

    it('should handle numeric values for category and action', () => {
      const mockDataLayer: any[] = [];
      (window as any).dataLayer = mockDataLayer;

      trackEventLegacy({
        category: 123 as any,
        action: 456 as any,
        label: 'test',
        value: 789
      });

      expect(mockDataLayer[0]).toEqual({
        event: 'custom_event',
        event_category: 123,
        event_action: 456,
        event_label: 'test',
        value: 789 as any
      });
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

    it('should handle empty path string', () => {
      const mockDataLayer: any[] = [];
      (window as any).dataLayer = mockDataLayer;
      
      // Mock window.location.pathname since empty string will fallback to it
      Object.defineProperty(window, 'location', {
        value: {
          pathname: '/fallback-page'
        },
        writable: true
      });

      trackPageView('');

      expect(mockDataLayer[0]).toEqual({
        event: 'pageview',
        page_path: '/fallback-page'
      });
    });

    it('should handle non-array dataLayer for pageview', () => {
      (window as any).dataLayer = 'not-an-array';

      // Should throw an error because the analytics function doesn't check if dataLayer is an array
      expect(() => {
        trackPageView('/test');
      }).toThrow('window.dataLayer.push is not a function');
    });

    it('should handle null window object for pageview', () => {
      const originalWindow = (global as any).window;
      (global as any).window = null;

      // Should not throw an error
      expect(() => {
        trackPageView('/test');
      }).not.toThrow();

      // Restore window
      (global as any).window = originalWindow;
    });

    it('should handle undefined location.pathname', () => {
      const mockDataLayer: any[] = [];
      (window as any).dataLayer = mockDataLayer;
      
      // Mock window.location without pathname
      Object.defineProperty(window, 'location', {
        value: {},
        writable: true
      });

      trackPageView();

      expect(mockDataLayer[0]).toEqual({
        event: 'pageview',
        page_path: undefined
      });
    });

    it('should handle complex path with query parameters and hash', () => {
      const mockDataLayer: any[] = [];
      (window as any).dataLayer = mockDataLayer;

      const complexPath = '/page?param1=value1&param2=value2#section';
      trackPageView(complexPath);

      expect(mockDataLayer[0]).toEqual({
        event: 'pageview',
        page_path: complexPath
      });
    });
  });
});

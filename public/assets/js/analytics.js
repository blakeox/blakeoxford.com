// analytics.js - Analytics utility for navigation and general event tracking

/**
 * Track an analytics event using available providers (GTM, gtag, plausible, fathom, etc.)
 * @param {string} eventName - Name of the event to track
 * @param {Object} eventData - Additional data to send with the event
 */
export function trackEvent(eventName, eventData = {}) {
  // Google Tag Manager (GTM) - pushes to dataLayer for GTM, Clarity, GA, etc.
  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({
      event: eventName,
      ...eventData
    });
  }
  // Google Analytics (gtag)
  if (typeof gtag === 'function') {
    gtag('event', eventName, eventData);
  }
  // Plausible Analytics
  else if (typeof plausible === 'function') {
    plausible(eventName, { props: eventData });
  }
  // Fathom Analytics
  else if (typeof fathom === 'object' && typeof fathom.trackEvent === 'function') {
    fathom.trackEvent(eventName, eventData);
  }
  // Microsoft Clarity (optional, via GTM or direct)
  if (typeof clarity === 'function') {
    clarity('track', eventName, eventData);
  }
  // Fallback: log to console for debugging
  if (
    !Array.isArray(window.dataLayer) &&
    typeof gtag !== 'function' &&
    typeof plausible !== 'function' &&
    (typeof fathom !== 'object' || typeof fathom.trackEvent !== 'function') &&
    typeof clarity !== 'function'
  ) {
    console.debug('[Analytics]', eventName, eventData);
  }
}

// General analytics utility for event tracking (legacy format)
// This file is loaded by Google Tag Manager, which can be configured to send data to Google Analytics, Microsoft Clarity, etc.

export function trackEventLegacy({ category, action, label = '', value = undefined }) {
  if (window && window.dataLayer) {
    window.dataLayer.push({
      event: 'custom_event',
      event_category: category,
      event_action: action,
      event_label: label,
      value: value,
    });
  }
}

// Example usage:
// trackEvent({ category: 'Navigation', action: 'Click', label: 'nav-home' });

// Optionally, you can add more helpers for page views, etc.
export function trackPageView(path) {
  if (window && window.dataLayer) {
    window.dataLayer.push({
      event: 'pageview',
      page_path: path || window.location.pathname,
    });
  }
}
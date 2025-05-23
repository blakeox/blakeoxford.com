// analytics.js - Analytics utility for navigation and general event tracking

/**
 * Track an analytics event using available providers (gtag, plausible, fathom, etc.)
 * @param {string} eventName - Name of the event to track
 * @param {Object} eventData - Additional data to send with the event
 */
export function trackEvent(eventName, eventData = {}) {
  if (typeof gtag === 'function') {
    gtag('event', eventName, eventData);
  } else if (typeof plausible === 'function') {
    plausible(eventName, { props: eventData });
  } else if (typeof fathom === 'object' && typeof fathom.trackEvent === 'function') {
    fathom.trackEvent(eventName, eventData);
  } else {
    // Analytics not detected, log to console for debugging
    console.debug('[Analytics]', eventName, eventData);
  }
} 
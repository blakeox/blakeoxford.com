/**
 * A/B Testing Performance Framework
 * Advanced experimentation system with performance impact measurement
 */

class ABTestingFramework {
  constructor(options = {}) {
    this.experiments = new Map();
    this.activeTests = new Map();
    this.userSegments = new Map();
    this.performanceMetrics = new Map();
    this.conversionEvents = new Map();
    this.storageKey = 'ab-testing-data';
    this.segmentKey = 'user-segment';
    this.options = {
      enableLocalStorage: true,
      trackPerformance: true,
      enableAnalytics: true,
      defaultTrafficSplit: 0.5,
      ...options
    };

    this.init();
  }

  init() {
    this.loadStoredData();
    this.initializeUserSegment();
    this.setupPerformanceTracking();
    this.setupConversionTracking();

    console.log('📈 A/B Testing Framework initialized');
  }

  // Load stored experiment data
  loadStoredData() {
    if (this.options.enableLocalStorage) {
      try {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
          const data = JSON.parse(stored);
          this.activeTests = new Map(data.activeTests || []);
          this.performanceMetrics = new Map(data.performanceMetrics || []);
        }
      } catch (error) {
        console.warn('Failed to load A/B testing data:', error);
      }
    }
  }

  // Save experiment data
  saveData() {
    if (this.options.enableLocalStorage) {
      try {
        const data = {
          activeTests: Array.from(this.activeTests.entries()),
          performanceMetrics: Array.from(this.performanceMetrics.entries()),
          timestamp: Date.now()
        };
        localStorage.setItem(this.storageKey, JSON.stringify(data));
      } catch (error) {
        console.warn('Failed to save A/B testing data:', error);
      }
    }
  }

  // Initialize user segment
  initializeUserSegment() {
    let userSegment = this.getUserSegment();

    if (!userSegment) {
      userSegment = this.createUserSegment();
      if (this.options.enableLocalStorage) {
        localStorage.setItem(this.segmentKey, JSON.stringify(userSegment));
      }
    }

    this.currentUserSegment = userSegment;
  }

  getUserSegment() {
    if (this.options.enableLocalStorage) {
      try {
        const stored = localStorage.getItem(this.segmentKey);
        return stored ? JSON.parse(stored) : null;
      } catch {
        return null;
      }
    }
    return null;
  }

  createUserSegment() {
    const userAgent = navigator.userAgent;
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    return {
      id: this.generateUserId(),
      deviceType: this.getDeviceType(viewport.width),
      browser: this.getBrowserInfo(userAgent),
      firstVisit: Date.now(),
      sessionId: this.generateSessionId(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      viewport: viewport,
      connection: this.getConnectionInfo()
    };
  }

  generateUserId() {
    return 'user_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  generateSessionId() {
    return 'session_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  getDeviceType(width) {
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  getBrowserInfo(userAgent) {
    if (userAgent.includes('Chrome')) return 'chrome';
    if (userAgent.includes('Firefox')) return 'firefox';
    if (userAgent.includes('Safari')) return 'safari';
    if (userAgent.includes('Edge')) return 'edge';
    return 'other';
  }

  getConnectionInfo() {
    if ('connection' in navigator) {
      return {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt,
        saveData: navigator.connection.saveData
      };
    }
    return null;
  }

  // Define an A/B test experiment
  defineExperiment(config) {
    const experiment = {
      id: config.id,
      name: config.name,
      description: config.description,
      variants: config.variants, // Array of variant configurations
      trafficSplit: config.trafficSplit || this.options.defaultTrafficSplit,
      targetSegments: config.targetSegments || [],
      startDate: config.startDate || Date.now(),
      endDate: config.endDate,
      isActive: config.isActive !== false,
      goals: config.goals || [], // Conversion goals to track
      performanceMetrics: config.performanceMetrics || ['LCP', 'FID', 'CLS'],
      successCriteria: config.successCriteria || {}
    };

    this.experiments.set(experiment.id, experiment);

    if (experiment.isActive) {
      this.activateExperiment(experiment.id);
    }

    console.log(`🧪 Experiment defined: ${experiment.name}`);
    return experiment;
  }

  // Activate an experiment for the current user
  activateExperiment(experimentId) {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      console.warn(`Experiment ${experimentId} not found`);
      return null;
    }

    // Check if user is already in this experiment
    if (this.activeTests.has(experimentId)) {
      return this.activeTests.get(experimentId);
    }

    // Check targeting criteria
    if (!this.isUserEligible(experiment)) {
      return null;
    }

    // Assign variant
    const assignment = this.assignVariant(experiment);
    if (!assignment) {
      return null;
    }

    // Store assignment
    this.activeTests.set(experimentId, assignment);
    this.saveData();

    // Track assignment event
    this.trackEvent('experiment_assigned', {
      experimentId,
      variantId: assignment.variantId,
      timestamp: Date.now()
    });

    // Apply variant if it has DOM changes
    this.applyVariant(assignment);

    console.log(`🎯 User assigned to experiment ${experimentId}, variant ${assignment.variantId}`);
    return assignment;
  }

  // Check if user is eligible for experiment
  isUserEligible(experiment) {
    // Check date range
    const now = Date.now();
    if (experiment.startDate && now < experiment.startDate) return false;
    if (experiment.endDate && now > experiment.endDate) return false;

    // Check targeting segments
    if (experiment.targetSegments.length > 0) {
      const userSegment = this.currentUserSegment;
      return experiment.targetSegments.some(target => {
        return this.matchesSegment(userSegment, target);
      });
    }

    return true;
  }

  matchesSegment(userSegment, targetSegment) {
    if (targetSegment.deviceType && userSegment.deviceType !== targetSegment.deviceType) {
      return false;
    }
    if (targetSegment.browser && userSegment.browser !== targetSegment.browser) {
      return false;
    }
    if (targetSegment.connection && userSegment.connection) {
      if (targetSegment.connection.effectiveType &&
          userSegment.connection.effectiveType !== targetSegment.connection.effectiveType) {
        return false;
      }
    }
    return true;
  }

  // Assign user to a variant
  assignVariant(experiment) {
    const userId = this.currentUserSegment.id;
    const hash = this.hashString(userId + experiment.id);
    const bucket = (hash % 100) / 100; // Convert to 0-1 range

    let cumulativeProbability = 0;
    for (const variant of experiment.variants) {
      cumulativeProbability += variant.traffic || (1 / experiment.variants.length);

      if (bucket <= cumulativeProbability) {
        return {
          experimentId: experiment.id,
          variantId: variant.id,
          variantName: variant.name,
          assignedAt: Date.now(),
          config: variant.config || {}
        };
      }
    }

    // Fallback to control
    return {
      experimentId: experiment.id,
      variantId: 'control',
      variantName: 'Control',
      assignedAt: Date.now(),
      config: {}
    };
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Apply variant configuration to the page
  applyVariant(assignment) {
    const config = assignment.config;

    if (config.css) {
      this.applyCSSChanges(config.css);
    }

    if (config.content) {
      this.applyContentChanges(config.content);
    }

    if (config.features) {
      this.applyFeatureFlags(config.features);
    }

    if (config.performance) {
      this.applyPerformanceOptimizations(config.performance);
    }

    // Add experiment class to body for CSS targeting
    document.body.classList.add(`experiment-${assignment.experimentId}-${assignment.variantId}`);
  }

  applyCSSChanges(cssChanges) {
    const style = document.createElement('style');
    style.setAttribute('data-ab-test', 'true');
    style.textContent = cssChanges;
    document.head.appendChild(style);
  }

  applyContentChanges(contentChanges) {
    Object.entries(contentChanges).forEach(([selector, newContent]) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        if (typeof newContent === 'string') {
          element.textContent = newContent;
        } else if (newContent.html) {
          element.innerHTML = newContent.html;
        } else if (newContent.attributes) {
          Object.entries(newContent.attributes).forEach(([attr, value]) => {
            element.setAttribute(attr, value);
          });
        }
      });
    });
  }

  applyFeatureFlags(features) {
    window.abTestFeatures = window.abTestFeatures || {};
    Object.assign(window.abTestFeatures, features);
  }

  applyPerformanceOptimizations(perfConfig) {
    if (perfConfig.lazyLoading) {
      this.enableLazyLoading(perfConfig.lazyLoading);
    }

    if (perfConfig.preloading) {
      this.enablePreloading(perfConfig.preloading);
    }

    if (perfConfig.caching) {
      this.applyCachingStrategy(perfConfig.caching);
    }
  }

  enableLazyLoading(config) {
    if (config.images) {
      this.setupImageLazyLoading();
    }
    if (config.components) {
      this.setupComponentLazyLoading(config.components);
    }
  }

  enablePreloading(resources) {
    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.url;
      link.as = resource.as || 'fetch';
      if (resource.type) link.type = resource.type;
      document.head.appendChild(link);
    });
  }

  // Setup performance tracking for experiments
  setupPerformanceTracking() {
    if (!this.options.trackPerformance) return;

    // Track Core Web Vitals for each experiment variant
    if ('PerformanceObserver' in window) {
      // LCP tracking
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lcp = entries[entries.length - 1];
        this.recordPerformanceMetric('LCP', lcp.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // FID tracking
      const fidObserver = new PerformanceObserver((entryList) => {
        const firstInput = entryList.getEntries()[0];
        const fid = firstInput.processingStart - firstInput.startTime;
        this.recordPerformanceMetric('FID', fid);
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // CLS tracking
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        this.recordPerformanceMetric('CLS', clsValue);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    }
  }

  recordPerformanceMetric(metric, value) {
    const timestamp = Date.now();

    for (const [experimentId, assignment] of this.activeTests) {
      const key = `${experimentId}-${assignment.variantId}-${metric}`;

      if (!this.performanceMetrics.has(key)) {
        this.performanceMetrics.set(key, []);
      }

      this.performanceMetrics.get(key).push({
        value,
        timestamp,
        userSegment: this.currentUserSegment.deviceType
      });
    }

    this.saveData();
  }

  // Setup conversion tracking
  setupConversionTracking() {
    // Track page views as potential conversions
    this.trackEvent('page_view', {
      path: window.location.pathname,
      timestamp: Date.now()
    });

    // Track clicks on important elements
    document.addEventListener('click', (event) => {
      const target = event.target.closest('[data-track-conversion]');
      if (target) {
        const conversionType = target.dataset.trackConversion;
        this.trackConversion(conversionType, {
          element: target.tagName.toLowerCase(),
          text: target.textContent?.slice(0, 50),
          href: target.href
        });
      }
    });

    // Track form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target;
      if (form.dataset.trackConversion) {
        this.trackConversion(form.dataset.trackConversion, {
          formId: form.id,
          action: form.action
        });
      }
    });
  }

  trackConversion(conversionType, data = {}) {
    const conversionEvent = {
      type: conversionType,
      timestamp: Date.now(),
      data,
      experiments: Object.fromEntries(this.activeTests)
    };

    // Store conversion
    const key = `conversion-${conversionType}-${Date.now()}`;
    this.conversionEvents.set(key, conversionEvent);

    // Track in analytics
    this.trackEvent('conversion', conversionEvent);

    console.log(`💰 Conversion tracked: ${conversionType}`, conversionEvent);
  }

  trackEvent(eventName, data) {
    // Send to analytics if available
    if (this.options.enableAnalytics && window.gtag) {
      window.gtag('event', eventName, {
        custom_parameter: JSON.stringify(data),
        experiment_data: JSON.stringify(Object.fromEntries(this.activeTests))
      });
    }

    // Send to custom analytics endpoint
    if (this.options.analyticsEndpoint) {
      fetch(this.options.analyticsEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: eventName, data })
      }).catch(error => console.warn('Analytics tracking failed:', error));
    }
  }

  // Get experiment results and statistics
  getExperimentResults(experimentId) {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return null;

    const results = {
      experiment: experiment,
      variants: {},
      performance: {},
      conversions: {},
      statistics: {}
    };

    // Collect performance data for each variant
    experiment.variants.forEach(variant => {
      const variantId = variant.id;

      // Performance metrics
      experiment.performanceMetrics.forEach(metric => {
        const key = `${experimentId}-${variantId}-${metric}`;
        const metrics = this.performanceMetrics.get(key) || [];

        if (metrics.length > 0) {
          results.performance[`${variantId}-${metric}`] = {
            count: metrics.length,
            average: metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length,
            median: this.calculateMedian(metrics.map(m => m.value)),
            p95: this.calculatePercentile(metrics.map(m => m.value), 95)
          };
        }
      });
    });

    // Calculate statistical significance
    results.statistics = this.calculateStatisticalSignificance(experimentId);

    return results;
  }

  calculateMedian(values) {
    const sorted = values.slice().sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  calculatePercentile(values, percentile) {
    const sorted = values.slice().sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    if (Math.floor(index) === index) {
      return sorted[index];
    } else {
      const lower = Math.floor(index);
      const upper = Math.ceil(index);
      return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
    }
  }

  calculateStatisticalSignificance(experimentId) {
    // Simplified statistical significance calculation
    // In production, you'd want to use proper statistical tests
    const results = { significant: false, confidence: 0 };

    // This would require more sophisticated statistical analysis
    // For now, return placeholder
    return results;
  }

  // Get current user's experiment assignments
  getUserExperiments() {
    return Object.fromEntries(this.activeTests);
  }

  // Check if user is in a specific experiment variant
  isInVariant(experimentId, variantId) {
    const assignment = this.activeTests.get(experimentId);
    return assignment && assignment.variantId === variantId;
  }

  // Get feature flag value
  getFeatureFlag(flagName, defaultValue = false) {
    return window.abTestFeatures?.[flagName] ?? defaultValue;
  }

  // Clean up expired experiments
  cleanupExpiredExperiments() {
    const now = Date.now();

    for (const [experimentId, experiment] of this.experiments) {
      if (experiment.endDate && now > experiment.endDate) {
        this.activeTests.delete(experimentId);
        console.log(`🧹 Cleaned up expired experiment: ${experimentId}`);
      }
    }

    this.saveData();
  }
}

// Initialize A/B Testing Framework
window.ABTestingFramework = new ABTestingFramework({
  enableLocalStorage: true,
  trackPerformance: true,
  enableAnalytics: typeof window.gtag !== 'undefined'
});

// Expose utility functions
window.abTest = {
  define: (config) => window.ABTestingFramework.defineExperiment(config),
  activate: (id) => window.ABTestingFramework.activateExperiment(id),
  isInVariant: (id, variant) => window.ABTestingFramework.isInVariant(id, variant),
  trackConversion: (type, data) => window.ABTestingFramework.trackConversion(type, data),
  getFeature: (flag, defaultValue) => window.ABTestingFramework.getFeatureFlag(flag, defaultValue),
  getResults: (id) => window.ABTestingFramework.getExperimentResults(id),
  getUserExperiments: () => window.ABTestingFramework.getUserExperiments()
};

// Example experiment definitions
document.addEventListener('DOMContentLoaded', () => {
  // Example: Hero section optimization
  window.abTest.define({
    id: 'hero-optimization-v1',
    name: 'Hero Section Optimization',
    description: 'Test different hero section layouts for better engagement',
    variants: [
      {
        id: 'control',
        name: 'Original Hero',
        traffic: 0.5,
        config: {}
      },
      {
        id: 'minimal',
        name: 'Minimal Hero',
        traffic: 0.5,
        config: {
          css: `
            .hero-section {
              padding: 2rem 0 !important;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
            }
            .hero-title {
              font-size: 2.5rem !important;
              line-height: 1.2 !important;
            }
          `,
          content: {
            '.hero-subtitle': 'Focused on creating exceptional digital experiences'
          },
          features: {
            minimalHero: true,
            reducedAnimations: true
          },
          performance: {
            lazyLoading: { images: true },
            preloading: [
              { url: '/assets/images/hero-minimal.webp', as: 'image' }
            ]
          }
        }
      }
    ],
    goals: ['click_cta', 'scroll_engagement', 'time_on_page'],
    performanceMetrics: ['LCP', 'CLS'],
    targetSegments: [
      { deviceType: 'desktop' },
      { deviceType: 'mobile' }
    ]
  });

  // Activate the experiment
  window.abTest.activate('hero-optimization-v1');
});

console.log('📈 A/B Testing Framework loaded and ready');

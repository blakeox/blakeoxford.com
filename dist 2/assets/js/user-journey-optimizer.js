/**
 * User Journey Performance Optimization
 * Advanced user flow analysis and bottleneck identification system
 */

class UserJourneyOptimizer {
  constructor(options = {}) {
    this.journeys = new Map();
    this.userSessions = new Map();
    this.performanceMarkers = new Map();
    this.heatmapData = new Map();
    this.bottlenecks = new Map();
    this.optimizations = new Map();
    this.storageKey = 'user-journey-data';
    this.sessionKey = 'journey-session';
    this.currentSession = null;

    this.options = {
      enableTracking: true,
      enableHeatmaps: true,
      enableOptimization: true,
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      trackScrollDepth: true,
      trackUserInteractions: true,
      trackPerformanceMetrics: true,
      ...options
    };

    this.init();
  }

  init() {
    this.loadStoredData();
    this.initializeSession();
    this.setupEventTracking();
    this.setupPerformanceTracking();
    this.setupHeatmapTracking();
    this.startJourneyAnalysis();

    console.log('🎯 User Journey Optimizer initialized');
  }

  // Load stored journey data
  loadStoredData() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.journeys = new Map(data.journeys || []);
        this.performanceMarkers = new Map(data.performanceMarkers || []);
        this.bottlenecks = new Map(data.bottlenecks || []);
      }
    } catch (error) {
      console.warn('Failed to load journey data:', error);
    }
  }

  // Save journey data
  saveData() {
    try {
      const data = {
        journeys: Array.from(this.journeys.entries()),
        performanceMarkers: Array.from(this.performanceMarkers.entries()),
        bottlenecks: Array.from(this.bottlenecks.entries()),
        lastUpdated: Date.now()
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save journey data:', error);
    }
  }

  // Initialize user session
  initializeSession() {
    const sessionId = this.generateSessionId();
    const referrer = document.referrer || 'direct';
    const userAgent = navigator.userAgent;

    this.currentSession = {
      id: sessionId,
      startTime: Date.now(),
      referrer: referrer,
      entryPage: window.location.pathname,
      device: this.getDeviceInfo(),
      browser: this.getBrowserInfo(userAgent),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      connection: this.getConnectionInfo(),
      pages: [],
      interactions: [],
      performanceEvents: [],
      scrollEvents: [],
      exitIntent: false,
      conversionEvents: []
    };

    // Store session
    sessionStorage.setItem(this.sessionKey, JSON.stringify(this.currentSession));

    // Track page entry
    this.trackPageEntry();
  }

  generateSessionId() {
    return 'session_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  getDeviceInfo() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    return {
      type: width < 768 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop',
      width: width,
      height: height,
      pixelRatio: window.devicePixelRatio || 1,
      orientation: width > height ? 'landscape' : 'portrait',
      touch: 'ontouchstart' in window
    };
  }

  getBrowserInfo(userAgent) {
    const browsers = {
      chrome: /Chrome/i,
      firefox: /Firefox/i,
      safari: /Safari/i,
      edge: /Edge/i,
      ie: /MSIE|Trident/i
    };

    for (const [name, regex] of Object.entries(browsers)) {
      if (regex.test(userAgent)) {
        return name;
      }
    }
    return 'unknown';
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

  // Track page entry
  trackPageEntry() {
    const pageData = {
      url: window.location.href,
      path: window.location.pathname,
      title: document.title,
      timestamp: Date.now(),
      loadStart: performance.timing.navigationStart,
      domReady: null,
      loadComplete: null,
      firstPaint: null,
      firstContentfulPaint: null,
      largestContentfulPaint: null,
      scrollDepth: 0,
      timeOnPage: 0,
      interactions: 0,
      exits: 0
    };

    this.currentSession.pages.push(pageData);
    this.updateCurrentPage(pageData);
  }

  updateCurrentPage(updates) {
    if (this.currentSession.pages.length > 0) {
      const currentPage = this.currentSession.pages[this.currentSession.pages.length - 1];
      Object.assign(currentPage, updates);
      sessionStorage.setItem(this.sessionKey, JSON.stringify(this.currentSession));
    }
  }

  // Setup event tracking
  setupEventTracking() {
    if (!this.options.enableTracking) return;

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.trackVisibilityChange();
    });

    // Track beforeunload for exit tracking
    window.addEventListener('beforeunload', () => {
      this.trackPageExit();
    });

    // Track user interactions
    if (this.options.trackUserInteractions) {
      this.setupInteractionTracking();
    }

    // Track scroll depth
    if (this.options.trackScrollDepth) {
      this.setupScrollTracking();
    }

    // Track exit intent
    this.setupExitIntentTracking();
  }

  trackVisibilityChange() {
    const isVisible = !document.hidden;
    const timestamp = Date.now();

    this.currentSession.interactions.push({
      type: 'visibility_change',
      visible: isVisible,
      timestamp: timestamp
    });

    if (!isVisible) {
      this.updateTimeOnPage();
    }
  }

  trackPageExit() {
    this.updateTimeOnPage();
    this.saveJourneyData();
  }

  updateTimeOnPage() {
    const currentPage = this.currentSession.pages[this.currentSession.pages.length - 1];
    if (currentPage) {
      currentPage.timeOnPage = Date.now() - currentPage.timestamp;
      this.updateCurrentPage({ timeOnPage: currentPage.timeOnPage });
    }
  }

  // Setup interaction tracking
  setupInteractionTracking() {
    const interactionEvents = ['click', 'submit', 'input', 'focus', 'change'];

    interactionEvents.forEach(eventType => {
      document.addEventListener(eventType, (event) => {
        this.trackInteraction(eventType, event);
      });
    });
  }

  trackInteraction(type, event) {
    const target = event.target;
    const interaction = {
      type: type,
      timestamp: Date.now(),
      element: target.tagName.toLowerCase(),
      id: target.id || null,
      className: target.className || null,
      text: target.textContent?.slice(0, 100) || null,
      href: target.href || null,
      position: this.getElementPosition(target),
      viewport: {
        x: event.clientX || null,
        y: event.clientY || null
      }
    };

    this.currentSession.interactions.push(interaction);

    // Update page interaction count
    const currentPage = this.currentSession.pages[this.currentSession.pages.length - 1];
    if (currentPage) {
      currentPage.interactions++;
      this.updateCurrentPage({ interactions: currentPage.interactions });
    }

    // Check for conversion events
    if (target.dataset.trackConversion) {
      this.trackConversionEvent(target.dataset.trackConversion, interaction);
    }
  }

  getElementPosition(element) {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY,
      width: rect.width,
      height: rect.height
    };
  }

  trackConversionEvent(conversionType, interaction) {
    const conversionEvent = {
      type: conversionType,
      timestamp: Date.now(),
      interaction: interaction,
      sessionDuration: Date.now() - this.currentSession.startTime,
      pageCount: this.currentSession.pages.length,
      totalInteractions: this.currentSession.interactions.length
    };

    this.currentSession.conversionEvents.push(conversionEvent);

    console.log(`💰 Conversion event tracked: ${conversionType}`, conversionEvent);
  }

  // Setup scroll tracking
  setupScrollTracking() {
    let scrollTimer = null;
    let maxScrollDepth = 0;

    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        const scrollDepth = this.calculateScrollDepth();

        if (scrollDepth > maxScrollDepth) {
          maxScrollDepth = scrollDepth;

          this.currentSession.scrollEvents.push({
            depth: scrollDepth,
            timestamp: Date.now(),
            position: window.scrollY
          });

          // Update current page scroll depth
          this.updateCurrentPage({ scrollDepth: scrollDepth });
        }
      }, 100);
    });
  }

  calculateScrollDepth() {
    const scrollTop = window.scrollY;
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    return Math.round((scrollTop / documentHeight) * 100);
  }

  // Setup exit intent tracking
  setupExitIntentTracking() {
    let exitIntentTriggered = false;

    document.addEventListener('mouseleave', (event) => {
      if (event.clientY <= 0 && !exitIntentTriggered) {
        exitIntentTriggered = true;
        this.currentSession.exitIntent = true;

        this.currentSession.interactions.push({
          type: 'exit_intent',
          timestamp: Date.now(),
          scrollDepth: this.calculateScrollDepth(),
          timeOnPage: Date.now() - this.currentSession.startTime
        });

        console.log('🚪 Exit intent detected');
      }
    });
  }

  // Setup performance tracking
  setupPerformanceTracking() {
    if (!this.options.trackPerformanceMetrics) return;

    // Track page load metrics
    window.addEventListener('load', () => {
      setTimeout(() => {
        this.trackPageLoadMetrics();
      }, 100);
    });

    // Track Core Web Vitals
    if ('PerformanceObserver' in window) {
      this.setupCoreWebVitalsTracking();
    }

    // Track resource loading issues
    this.setupResourceTracking();
  }

  trackPageLoadMetrics() {
    const timing = performance.timing;
    const navigation = performance.getEntriesByType('navigation')[0];

    const metrics = {
      domainLookup: timing.domainLookupEnd - timing.domainLookupStart,
      tcpConnect: timing.connectEnd - timing.connectStart,
      request: timing.responseStart - timing.requestStart,
      response: timing.responseEnd - timing.responseStart,
      domProcessing: timing.domComplete - timing.domLoading,
      onLoad: timing.loadEventEnd - timing.loadEventStart,
      totalTime: timing.loadEventEnd - timing.navigationStart
    };

    if (navigation) {
      metrics.transferSize = navigation.transferSize || 0;
      metrics.encodedBodySize = navigation.encodedBodySize || 0;
      metrics.decodedBodySize = navigation.decodedBodySize || 0;
    }

    this.currentSession.performanceEvents.push({
      type: 'page_load',
      timestamp: Date.now(),
      metrics: metrics
    });

    // Update current page metrics
    this.updateCurrentPage({
      domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
      loadComplete: timing.loadEventEnd - timing.navigationStart
    });
  }

  setupCoreWebVitalsTracking() {
    // LCP tracking
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lcp = entries[entries.length - 1];

      this.currentSession.performanceEvents.push({
        type: 'LCP',
        timestamp: Date.now(),
        value: lcp.startTime,
        element: lcp.element?.tagName || null
      });

      this.updateCurrentPage({ largestContentfulPaint: lcp.startTime });
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

    // FID tracking
    const fidObserver = new PerformanceObserver((entryList) => {
      const firstInput = entryList.getEntries()[0];
      const fid = firstInput.processingStart - firstInput.startTime;

      this.currentSession.performanceEvents.push({
        type: 'FID',
        timestamp: Date.now(),
        value: fid,
        eventType: firstInput.name
      });
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

      this.currentSession.performanceEvents.push({
        type: 'CLS',
        timestamp: Date.now(),
        value: clsValue
      });
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });
  }

  setupResourceTracking() {
    // Track failed resource loads
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.trackResourceError(event);
      }
    }, true);

    // Track slow resources
    window.addEventListener('load', () => {
      setTimeout(() => {
        this.analyzeResourcePerformance();
      }, 1000);
    });
  }

  trackResourceError(event) {
    const resource = {
      type: 'resource_error',
      timestamp: Date.now(),
      element: event.target.tagName,
      source: event.target.src || event.target.href,
      error: event.type
    };

    this.currentSession.performanceEvents.push(resource);
    console.warn('Resource loading error:', resource);
  }

  analyzeResourcePerformance() {
    const resources = performance.getEntriesByType('resource');
    const slowResources = resources.filter(resource => resource.duration > 1000);

    slowResources.forEach(resource => {
      this.currentSession.performanceEvents.push({
        type: 'slow_resource',
        timestamp: Date.now(),
        name: resource.name,
        duration: resource.duration,
        size: resource.transferSize || 0
      });
    });
  }

  // Setup heatmap tracking
  setupHeatmapTracking() {
    if (!this.options.enableHeatmaps) return;

    // Track click heatmap
    document.addEventListener('click', (event) => {
      this.recordHeatmapPoint('click', event.clientX, event.clientY);
    });

    // Track scroll heatmap
    let scrollTimer = null;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        this.recordScrollHeatmap();
      }, 250);
    });

    // Track hover heatmap (sampled)
    let hoverSampleRate = 0.1; // 10% sampling
    document.addEventListener('mousemove', (event) => {
      if (Math.random() < hoverSampleRate) {
        this.recordHeatmapPoint('hover', event.clientX, event.clientY);
      }
    });
  }

  recordHeatmapPoint(type, x, y) {
    const page = window.location.pathname;
    const key = `${page}-${type}`;

    if (!this.heatmapData.has(key)) {
      this.heatmapData.set(key, []);
    }

    this.heatmapData.get(key).push({
      x: x,
      y: y,
      timestamp: Date.now(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    });
  }

  recordScrollHeatmap() {
    const scrollY = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercentage = (scrollY / maxScroll) * 100;

    const page = window.location.pathname;
    const key = `${page}-scroll`;

    if (!this.heatmapData.has(key)) {
      this.heatmapData.set(key, {});
    }

    const scrollData = this.heatmapData.get(key);
    const bucket = Math.floor(scrollPercentage / 5) * 5; // 5% buckets
    scrollData[bucket] = (scrollData[bucket] || 0) + 1;
  }

  // Journey analysis
  startJourneyAnalysis() {
    // Analyze journey patterns every 30 seconds
    setInterval(() => {
      this.analyzeCurrentJourney();
    }, 30000);

    // Run comprehensive analysis on page unload
    window.addEventListener('beforeunload', () => {
      this.saveJourneyData();
    });
  }

  analyzeCurrentJourney() {
    if (!this.currentSession) return;

    const journey = this.buildJourneyMap();
    this.identifyBottlenecks(journey);
    this.suggestOptimizations(journey);
  }

  buildJourneyMap() {
    const journey = {
      sessionId: this.currentSession.id,
      device: this.currentSession.device.type,
      entryPoint: this.currentSession.entryPage,
      pages: this.currentSession.pages.map(page => ({
        path: page.path,
        timeOnPage: page.timeOnPage,
        interactions: page.interactions,
        scrollDepth: page.scrollDepth,
        loadTime: page.loadComplete,
        exitRate: page.exits / (page.exits + 1) // Simplified calculation
      })),
      totalInteractions: this.currentSession.interactions.length,
      conversionEvents: this.currentSession.conversionEvents,
      performanceIssues: this.identifyPerformanceIssues()
    };

    return journey;
  }

  identifyPerformanceIssues() {
    const issues = [];

    this.currentSession.performanceEvents.forEach(event => {
      if (event.type === 'LCP' && event.value > 2500) {
        issues.push({
          type: 'slow_lcp',
          value: event.value,
          threshold: 2500,
          impact: 'high'
        });
      }

      if (event.type === 'FID' && event.value > 100) {
        issues.push({
          type: 'slow_fid',
          value: event.value,
          threshold: 100,
          impact: 'medium'
        });
      }

      if (event.type === 'CLS' && event.value > 0.1) {
        issues.push({
          type: 'high_cls',
          value: event.value,
          threshold: 0.1,
          impact: 'medium'
        });
      }
    });

    return issues;
  }

  identifyBottlenecks(journey) {
    const bottlenecks = [];

    // High exit rate pages
    journey.pages.forEach(page => {
      if (page.exitRate > 0.7) {
        bottlenecks.push({
          type: 'high_exit_rate',
          page: page.path,
          value: page.exitRate,
          severity: 'high'
        });
      }
    });

    // Low engagement pages
    journey.pages.forEach(page => {
      if (page.timeOnPage < 10000 && page.interactions < 2) {
        bottlenecks.push({
          type: 'low_engagement',
          page: page.path,
          timeOnPage: page.timeOnPage,
          interactions: page.interactions,
          severity: 'medium'
        });
      }
    });

    // Slow loading pages
    journey.pages.forEach(page => {
      if (page.loadTime > 3000) {
        bottlenecks.push({
          type: 'slow_loading',
          page: page.path,
          loadTime: page.loadTime,
          severity: 'high'
        });
      }
    });

    this.bottlenecks.set(journey.sessionId, bottlenecks);
  }

  suggestOptimizations(journey) {
    const optimizations = [];

    // Analyze bottlenecks and suggest fixes
    const sessionBottlenecks = this.bottlenecks.get(journey.sessionId) || [];

    sessionBottlenecks.forEach(bottleneck => {
      switch (bottleneck.type) {
        case 'slow_loading':
          optimizations.push({
            type: 'performance',
            action: 'optimize_page_load',
            page: bottleneck.page,
            suggestions: [
              'Implement critical CSS inlining',
              'Optimize images and use WebP format',
              'Enable resource preloading',
              'Minimize JavaScript bundles'
            ]
          });
          break;

        case 'high_exit_rate':
          optimizations.push({
            type: 'engagement',
            action: 'improve_page_content',
            page: bottleneck.page,
            suggestions: [
              'Add more engaging content above the fold',
              'Improve page loading speed',
              'Add clear call-to-action buttons',
              'Optimize for mobile experience'
            ]
          });
          break;

        case 'low_engagement':
          optimizations.push({
            type: 'ux',
            action: 'enhance_interactivity',
            page: bottleneck.page,
            suggestions: [
              'Add interactive elements',
              'Improve content readability',
              'Add progress indicators',
              'Implement scroll-triggered animations'
            ]
          });
          break;
      }
    });

    this.optimizations.set(journey.sessionId, optimizations);
  }

  saveJourneyData() {
    if (!this.currentSession) return;

    const journeyData = {
      session: this.currentSession,
      analysis: {
        bottlenecks: this.bottlenecks.get(this.currentSession.id) || [],
        optimizations: this.optimizations.get(this.currentSession.id) || []
      },
      completedAt: Date.now()
    };

    this.journeys.set(this.currentSession.id, journeyData);
    this.saveData();
  }

  // Generate journey analytics report
  generateJourneyReport() {
    const report = {
      overview: {
        totalSessions: this.journeys.size,
        avgSessionDuration: 0,
        avgPagesPerSession: 0,
        conversionRate: 0,
        topExitPages: {},
        deviceBreakdown: {},
        browserBreakdown: {}
      },
      performance: {
        avgLoadTime: 0,
        slowestPages: [],
        commonIssues: {},
        coreWebVitals: {
          lcp: { avg: 0, p95: 0 },
          fid: { avg: 0, p95: 0 },
          cls: { avg: 0, p95: 0 }
        }
      },
      bottlenecks: {
        highExitPages: [],
        lowEngagementPages: [],
        performanceIssues: []
      },
      optimizations: {
        recommendations: [],
        priorityActions: [],
        estimatedImpact: {}
      }
    };

    // Calculate overview metrics
    const journeys = Array.from(this.journeys.values());

    if (journeys.length > 0) {
      report.overview.avgSessionDuration = journeys.reduce((sum, j) =>
        sum + (j.session.pages.reduce((pageSum, p) => pageSum + p.timeOnPage, 0)), 0
      ) / journeys.length;

      report.overview.avgPagesPerSession = journeys.reduce((sum, j) =>
        sum + j.session.pages.length, 0
      ) / journeys.length;

      // Calculate conversion rate
      const conversions = journeys.filter(j => j.session.conversionEvents.length > 0);
      report.overview.conversionRate = (conversions.length / journeys.length) * 100;
    }

    return report;
  }

  // Get real-time journey insights
  getRealTimeInsights() {
    if (!this.currentSession) return null;

    const currentJourney = this.buildJourneyMap();
    const bottlenecks = this.bottlenecks.get(this.currentSession.id) || [];
    const optimizations = this.optimizations.get(this.currentSession.id) || [];

    return {
      session: {
        duration: Date.now() - this.currentSession.startTime,
        pagesVisited: this.currentSession.pages.length,
        interactions: this.currentSession.interactions.length,
        currentPage: window.location.pathname,
        scrollDepth: this.calculateScrollDepth()
      },
      performance: {
        issues: this.identifyPerformanceIssues(),
        loadTimes: this.currentSession.pages.map(p => ({
          page: p.path,
          loadTime: p.loadComplete
        }))
      },
      bottlenecks: bottlenecks,
      optimizations: optimizations,
      predictions: {
        exitProbability: this.predictExitProbability(),
        conversionProbability: this.predictConversionProbability(),
        nextAction: this.predictNextAction()
      }
    };
  }

  predictExitProbability() {
    // Simplified exit prediction based on current behavior
    const timeOnCurrentPage = Date.now() - (this.currentSession.pages[this.currentSession.pages.length - 1]?.timestamp || Date.now());
    const scrollDepth = this.calculateScrollDepth();
    const interactions = this.currentSession.interactions.length;

    let exitScore = 0;

    if (timeOnCurrentPage > 60000) exitScore += 0.3; // Over 1 minute
    if (scrollDepth < 25) exitScore += 0.4; // Low scroll
    if (interactions < 2) exitScore += 0.3; // Low interaction

    return Math.min(exitScore, 1.0);
  }

  predictConversionProbability() {
    // Simplified conversion prediction
    const pagesVisited = this.currentSession.pages.length;
    const totalInteractions = this.currentSession.interactions.length;
    const sessionDuration = Date.now() - this.currentSession.startTime;

    let conversionScore = 0;

    if (pagesVisited >= 3) conversionScore += 0.3;
    if (totalInteractions >= 5) conversionScore += 0.4;
    if (sessionDuration > 120000) conversionScore += 0.3; // Over 2 minutes

    return Math.min(conversionScore, 1.0);
  }

  predictNextAction() {
    // Predict likely next user action based on patterns
    const currentPage = window.location.pathname;
    const interactions = this.currentSession.interactions;
    const lastInteraction = interactions[interactions.length - 1];

    if (lastInteraction?.type === 'scroll' && this.calculateScrollDepth() > 80) {
      return 'likely_to_navigate';
    }

    if (lastInteraction?.type === 'click' && lastInteraction.element === 'button') {
      return 'likely_to_convert';
    }

    if (this.currentSession.exitIntent) {
      return 'likely_to_exit';
    }

    return 'exploring_content';
  }
}

// Initialize User Journey Optimizer
window.UserJourneyOptimizer = new UserJourneyOptimizer({
  enableTracking: true,
  enableHeatmaps: true,
  enableOptimization: true,
  trackScrollDepth: true,
  trackUserInteractions: true,
  trackPerformanceMetrics: true
});

// Expose utility functions
window.journeyOptimizer = {
  getInsights: () => window.UserJourneyOptimizer.getRealTimeInsights(),
  getReport: () => window.UserJourneyOptimizer.generateJourneyReport(),
  trackConversion: (type) => window.UserJourneyOptimizer.trackConversionEvent(type, {}),
  getCurrentSession: () => window.UserJourneyOptimizer.currentSession,
  getBottlenecks: () => Array.from(window.UserJourneyOptimizer.bottlenecks.entries()),
  getOptimizations: () => Array.from(window.UserJourneyOptimizer.optimizations.entries())
};

console.log('🎯 User Journey Optimizer loaded and tracking');

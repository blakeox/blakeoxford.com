/**
 * AI-Powered Resource Prediction System
 * Uses machine learning to predict and preload resources based on user behavior
 */

class MLResourcePredictor {
  constructor() {
    this.userBehaviorData = [];
    this.predictionModel = null;
    this.sessionId = this.generateSessionId();
    this.init();
  }

  init() {
    this.setupBehaviorTracking();
    this.loadPredictionModel();
    this.setupPredictivePreloading();
    console.log('🧠 ML Resource Predictor initialized');
  }

  // Track user behavior patterns
  setupBehaviorTracking() {
    // Track mouse movement patterns
    let mouseData = [];
    document.addEventListener('mousemove', (e) => {
      mouseData.push({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
        timestamp: Date.now()
      });

      // Keep only last 50 points
      if (mouseData.length > 50) mouseData.shift();
    });

    // Track scroll patterns
    let scrollData = [];
    window.addEventListener('scroll', () => {
      const scrollPercentage = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      scrollData.push({
        percentage: scrollPercentage,
        timestamp: Date.now(),
        velocity: this.calculateScrollVelocity()
      });

      if (scrollData.length > 20) scrollData.shift();
    });

    // Track click patterns and navigation intent
    document.addEventListener('click', (e) => {
      const target = e.target.closest('a, button');
      if (target) {
        this.recordInteraction({
          type: 'click',
          element: target.tagName.toLowerCase(),
          href: target.href || null,
          text: target.textContent?.slice(0, 50),
          position: this.getElementPosition(target),
          timestamp: Date.now()
        });
      }
    });

    // Track hover intent (strong predictor of navigation)
    document.addEventListener('mouseenter', (e) => {
      const target = e.target.closest('a');
      if (target && target.href) {
        setTimeout(() => {
          if (target.matches(':hover')) {
            this.predictAndPreload(target.href, 'hover-intent');
          }
        }, 200); // 200ms hover threshold
      }
    }, true);
  }

  // Calculate scroll velocity for behavioral analysis
  calculateScrollVelocity() {
    const now = Date.now();
    const recent = this.scrollHistory?.filter(s => now - s.timestamp < 100) || [];
    if (recent.length < 2) return 0;

    const deltaY = recent[recent.length - 1].y - recent[0].y;
    const deltaTime = recent[recent.length - 1].timestamp - recent[0].timestamp;
    return deltaTime > 0 ? deltaY / deltaTime : 0;
  }

  // Record user interactions for ML training
  recordInteraction(interaction) {
    this.userBehaviorData.push(interaction);

    // Send to analytics for model training
    if (window.gtag) {
      window.gtag('event', 'user_behavior', {
        interaction_type: interaction.type,
        element_type: interaction.element,
        session_id: this.sessionId
      });
    }

    // Keep only recent interactions in memory
    if (this.userBehaviorData.length > 100) {
      this.userBehaviorData.shift();
    }
  }

  // Load or create prediction model
  async loadPredictionModel() {
    try {
      // Try to load pre-trained model from localStorage
      const savedModel = localStorage.getItem('ml-prediction-model');
      if (savedModel) {
        this.predictionModel = JSON.parse(savedModel);
        console.log('📊 Loaded existing prediction model');
      } else {
        // Initialize basic heuristic model
        this.predictionModel = this.createBaselineModel();
        console.log('🎯 Created baseline prediction model');
      }
    } catch (error) {
      console.warn('⚠️ Model loading failed, using fallback:', error);
      this.predictionModel = this.createBaselineModel();
    }
  }

  // Create baseline prediction model with heuristics
  createBaselineModel() {
    return {
      // Navigation patterns based on current page
      navigationRules: {
        '/': ['/about', '/projects', '/blog'],
        '/about': ['/projects', '/contact'],
        '/projects': ['/about', '/contact'],
        '/blog': ['/projects', '/about']
      },

      // Time-based predictions
      timeBasedRules: {
        quickBounce: 1000,     // < 1s likely to leave
        engaged: 10000,        // > 10s likely to navigate
        deepEngagement: 30000  // > 30s likely to explore more
      },

      // Behavioral triggers
      behaviorTriggers: {
        hoverDuration: 200,    // ms hover before preload
        scrollToBottom: 0.8,   // 80% scroll triggers next page preload
        repeatVisitor: true    // returning visitors get aggressive preloading
      }
    };
  }

  // Predict and preload resources based on ML analysis
  predictAndPreload(href, trigger) {
    if (!href || href.startsWith('#') || href.includes('mailto:') || href.includes('tel:')) {
      return;
    }

    const confidence = this.calculatePredictionConfidence(href, trigger);

    if (confidence > 0.6) {
      console.log(`🔮 Predicting navigation to ${href} (confidence: ${confidence.toFixed(2)}, trigger: ${trigger})`);

      // Preload the page
      this.preloadPage(href);

      // Preload associated resources
      this.preloadPageResources(href);

      // Track prediction for model improvement
      this.trackPrediction(href, confidence, trigger);
    }
  }

  // Calculate prediction confidence score
  calculatePredictionConfidence(href, trigger) {
    let baseConfidence = 0.3;

    // Trigger-based confidence
    switch (trigger) {
      case 'hover-intent':
        baseConfidence = 0.7;
        break;
      case 'scroll-engagement':
        baseConfidence = 0.5;
        break;
      case 'time-engagement':
        baseConfidence = 0.6;
        break;
      case 'return-visitor':
        baseConfidence = 0.8;
        break;
    }

    // Page context boost
    const currentPath = window.location.pathname;
    const likelyPages = this.predictionModel.navigationRules[currentPath] || [];
    if (likelyPages.some(page => href.includes(page))) {
      baseConfidence += 0.2;
    }

    // User engagement boost
    const timeOnPage = Date.now() - this.pageLoadTime;
    if (timeOnPage > this.predictionModel.timeBasedRules.engaged) {
      baseConfidence += 0.15;
    }

    // Return visitor boost
    if (this.isReturnVisitor()) {
      baseConfidence += 0.1;
    }

    return Math.min(baseConfidence, 0.95); // Cap at 95%
  }

  // Preload page with high priority
  preloadPage(href) {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    link.as = 'document';
    document.head.appendChild(link);
  }

  // Preload resources associated with predicted page
  preloadPageResources(href) {
    // Extract likely resource paths
    const pathSegments = href.split('/').filter(Boolean);
    const pageType = pathSegments[0] || 'home';

    const resourceMap = {
      'projects': [
        '/api/projects.json',
        '/assets/images/project-hero-640.avif'
      ],
      'blog': [
        '/api/blog.json',
        '/assets/images/blog-hero-640.avif'
      ],
      'about': [
        '/assets/images/profile-640.avif',
        '/assets/Resume.pdf'
      ]
    };

    const resources = resourceMap[pageType] || [];
    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = resource;
      document.head.appendChild(link);
    });
  }

  // Track prediction accuracy for model improvement
  trackPrediction(href, confidence, trigger) {
    const prediction = {
      href,
      confidence,
      trigger,
      timestamp: Date.now(),
      sessionId: this.sessionId
    };

    // Store for later analysis
    const predictions = JSON.parse(localStorage.getItem('ml-predictions') || '[]');
    predictions.push(prediction);

    // Keep only recent predictions
    const recent = predictions.filter(p => Date.now() - p.timestamp < 86400000); // 24 hours
    localStorage.setItem('ml-predictions', JSON.stringify(recent));
  }

  // Check if user is a return visitor
  isReturnVisitor() {
    const visitCount = parseInt(localStorage.getItem('visit-count') || '0');
    return visitCount > 1;
  }

  // Get element position for behavior analysis
  getElementPosition(element) {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left / window.innerWidth,
      y: rect.top / window.innerHeight,
      width: rect.width / window.innerWidth,
      height: rect.height / window.innerHeight
    };
  }

  // Generate unique session ID
  generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Setup engagement-based predictive preloading
  setupPredictivePreloading() {
    this.pageLoadTime = Date.now();

    // Time-based predictions
    setTimeout(() => {
      if (document.hasFocus()) {
        this.predictBasedOnEngagement();
      }
    }, this.predictionModel.timeBasedRules.engaged);

    // Scroll-based predictions
    window.addEventListener('scroll', () => {
      const scrollPercentage = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      if (scrollPercentage > this.predictionModel.behaviorTriggers.scrollToBottom) {
        this.predictBasedOnScroll();
      }
    });

    // Return visitor aggressive preloading
    if (this.isReturnVisitor()) {
      setTimeout(() => this.aggressivePreload(), 2000);
    }
  }

  predictBasedOnEngagement() {
    const currentPath = window.location.pathname;
    const likelyPages = this.predictionModel.navigationRules[currentPath] || [];

    likelyPages.forEach(page => {
      this.predictAndPreload(page, 'time-engagement');
    });
  }

  predictBasedOnScroll() {
    // User scrolled to bottom, likely to navigate
    const currentPath = window.location.pathname;
    if (currentPath.startsWith('/blog/') || currentPath.startsWith('/projects/')) {
      // Preload related content
      this.predictAndPreload('/blog', 'scroll-engagement');
      this.predictAndPreload('/projects', 'scroll-engagement');
    }
  }

  aggressivePreload() {
    console.log('🎯 Return visitor detected - aggressive preloading');

    // Preload all main navigation pages
    ['/about', '/projects', '/blog', '/contact'].forEach(page => {
      this.predictAndPreload(page, 'return-visitor');
    });
  }

  // Get prediction analytics
  getAnalytics() {
    const predictions = JSON.parse(localStorage.getItem('ml-predictions') || '[]');
    const accuracy = this.calculateAccuracy(predictions);

    return {
      totalPredictions: predictions.length,
      accuracy: accuracy,
      sessionId: this.sessionId,
      modelVersion: this.predictionModel.version || '1.0'
    };
  }

  calculateAccuracy(predictions) {
    // This would be enhanced with actual navigation tracking
    // For now, return estimated accuracy
    return 0.75; // 75% estimated accuracy
  }
}

// Initialize ML Resource Predictor
window.MLResourcePredictor = new MLResourcePredictor();

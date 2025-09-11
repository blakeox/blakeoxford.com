/**
 * GraphQL Query Optimization
 * Advanced query analysis, caching, and performance optimization system
 */

class GraphQLOptimizer {
  constructor(options = {}) {
    this.queries = new Map();
    this.queryCache = new Map();
    this.queryAnalytics = new Map();
    this.optimizations = new Map();
    this.schemaAnalysis = new Map();
    this.batchRequests = new Map();
    this.storageKey = 'graphql-optimizer-data';

    this.options = {
      enableCaching: true,
      enableBatching: true,
      enableAnalytics: true,
      enableOptimization: true,
      cacheTimeout: 5 * 60 * 1000, // 5 minutes
      batchWindow: 50, // 50ms batch window
      maxBatchSize: 10,
      maxCacheSize: 100,
      enablePersistentCache: true,
      enableQueryComplexityAnalysis: true,
      ...options
    };

    this.init();
  }

  init() {
    this.loadStoredData();
    this.setupQueryInterception();
    this.setupBatching();
    this.setupCacheManagement();
    this.startPerformanceMonitoring();

    console.log('🔍 GraphQL Optimizer initialized');
  }

  // Load stored optimization data
  loadStoredData() {
    if (this.options.enablePersistentCache) {
      try {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
          const data = JSON.parse(stored);
          this.queryCache = new Map(data.queryCache || []);
          this.queryAnalytics = new Map(data.queryAnalytics || []);
          this.optimizations = new Map(data.optimizations || []);
        }
      } catch (error) {
        console.warn('Failed to load GraphQL optimizer data:', error);
      }
    }
  }

  // Save optimization data
  saveData() {
    if (this.options.enablePersistentCache) {
      try {
        const data = {
          queryCache: Array.from(this.queryCache.entries()),
          queryAnalytics: Array.from(this.queryAnalytics.entries()),
          optimizations: Array.from(this.optimizations.entries()),
          lastUpdated: Date.now()
        };
        localStorage.setItem(this.storageKey, JSON.stringify(data));
      } catch (error) {
        console.warn('Failed to save GraphQL optimizer data:', error);
      }
    }
  }

  // Setup query interception for analysis and optimization
  setupQueryInterception() {
    // Intercept fetch requests to GraphQL endpoints
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const [url, options] = args;

      // Check if this is a GraphQL request
      if (this.isGraphQLRequest(url, options)) {
        return this.optimizedGraphQLFetch(url, options, originalFetch);
      }

      return originalFetch(...args);
    };

    // Intercept XMLHttpRequest for older implementations
    this.interceptXHR();
  }

  isGraphQLRequest(url, options) {
    // Check for common GraphQL endpoint patterns
    const graphqlPatterns = ['/graphql', '/api/graphql', '/v1/graphql'];
    const isGraphQLUrl = graphqlPatterns.some(pattern => url.includes(pattern));

    // Check for GraphQL in request body
    const hasGraphQLBody = options?.body &&
      (typeof options.body === 'string' && options.body.includes('query')) ||
      (options.body instanceof FormData && options.body.has('query'));

    return isGraphQLUrl || hasGraphQLBody;
  }

  async optimizedGraphQLFetch(url, options, originalFetch) {
    const startTime = performance.now();
    let query, variables, operationName;

    try {
      // Parse GraphQL request
      const requestData = this.parseGraphQLRequest(options);
      query = requestData.query;
      variables = requestData.variables;
      operationName = requestData.operationName;

      // Generate query signature for caching and analytics
      const querySignature = this.generateQuerySignature(query, variables);

      // Check cache first
      if (this.options.enableCaching) {
        const cachedResult = this.getCachedResult(querySignature);
        if (cachedResult) {
          this.recordQueryAnalytics(querySignature, startTime, true, 'cache_hit');
          return this.createCachedResponse(cachedResult);
        }
      }

      // Analyze query for optimization opportunities
      const analysis = this.analyzeQuery(query);
      const optimizedQuery = this.optimizeQuery(query, analysis);

      // Update request with optimized query if changes were made
      if (optimizedQuery !== query) {
        options = this.updateRequestWithOptimizedQuery(options, optimizedQuery, variables, operationName);
      }

      // Check for batching opportunity
      if (this.options.enableBatching && this.canBatchQuery(query)) {
        return this.addToBatch(querySignature, url, options, originalFetch, startTime);
      }

      // Execute the request
      const response = await originalFetch(url, options);
      const responseClone = response.clone();
      const responseData = await responseClone.json();

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Cache successful responses
      if (this.options.enableCaching && response.ok && !responseData.errors) {
        this.cacheResult(querySignature, responseData, analysis.cacheTTL);
      }

      // Record analytics
      this.recordQueryAnalytics(querySignature, startTime, false, 'network', {
        duration,
        query: optimizedQuery,
        analysis,
        variables,
        operationName,
        responseSize: JSON.stringify(responseData).length
      });

      return response;

    } catch (error) {
      const endTime = performance.now();
      this.recordQueryAnalytics(query || 'unknown', startTime, false, 'error', {
        error: error.message,
        duration: endTime - startTime
      });
      throw error;
    }
  }

  parseGraphQLRequest(options) {
    let requestData = {};

    try {
      if (options.body) {
        if (typeof options.body === 'string') {
          requestData = JSON.parse(options.body);
        } else if (options.body instanceof FormData) {
          const operations = options.body.get('operations');
          if (operations) {
            requestData = JSON.parse(operations);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to parse GraphQL request:', error);
    }

    return {
      query: requestData.query || '',
      variables: requestData.variables || {},
      operationName: requestData.operationName || null
    };
  }

  generateQuerySignature(query, variables) {
    // Normalize query (remove whitespace, comments)
    const normalizedQuery = this.normalizeQuery(query);

    // Create signature from query + variables
    const variablesString = JSON.stringify(variables || {});
    const signature = this.hashString(normalizedQuery + variablesString);

    return signature;
  }

  normalizeQuery(query) {
    return query
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/#[^\n]*/g, '') // Remove comments
      .trim();
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Query analysis for optimization
  analyzeQuery(query) {
    const analysis = {
      complexity: 0,
      depth: 0,
      fieldCount: 0,
      optimizations: [],
      cacheable: true,
      cacheTTL: 300000, // 5 minutes default
      estimatedCost: 0,
      selectionSets: [],
      fragments: [],
      variables: [],
      operations: []
    };

    if (!query) return analysis;

    try {
      // Parse query structure
      analysis.operations = this.parseOperations(query);
      analysis.fragments = this.parseFragments(query);
      analysis.variables = this.parseVariables(query);
      analysis.selectionSets = this.parseSelectionSets(query);

      // Calculate complexity metrics
      analysis.complexity = this.calculateQueryComplexity(query);
      analysis.depth = this.calculateQueryDepth(query);
      analysis.fieldCount = this.countFields(query);
      analysis.estimatedCost = this.estimateQueryCost(analysis);

      // Identify optimization opportunities
      analysis.optimizations = this.identifyOptimizations(query, analysis);

      // Determine cacheability
      analysis.cacheable = this.isQueryCacheable(query, analysis);
      if (analysis.cacheable) {
        analysis.cacheTTL = this.calculateCacheTTL(query, analysis);
      }

    } catch (error) {
      console.warn('Query analysis failed:', error);
      analysis.optimizations.push({
        type: 'syntax_error',
        message: 'Query contains syntax errors',
        severity: 'high'
      });
    }

    return analysis;
  }

  parseOperations(query) {
    const operations = [];
    const operationRegex = /(query|mutation|subscription)\s*(\w*)\s*(\([^)]*\))?\s*{/g;
    let match;

    while ((match = operationRegex.exec(query)) !== null) {
      operations.push({
        type: match[1],
        name: match[2] || 'unnamed',
        variables: match[3] || '',
        position: match.index
      });
    }

    return operations;
  }

  parseFragments(query) {
    const fragments = [];
    const fragmentRegex = /fragment\s+(\w+)\s+on\s+(\w+)\s*{([^}]*)}/g;
    let match;

    while ((match = fragmentRegex.exec(query)) !== null) {
      fragments.push({
        name: match[1],
        type: match[2],
        fields: match[3].trim(),
        position: match.index
      });
    }

    return fragments;
  }

  parseVariables(query) {
    const variables = [];
    const variableRegex = /\$(\w+):\s*([^,)]+)/g;
    let match;

    while ((match = variableRegex.exec(query)) !== null) {
      variables.push({
        name: match[1],
        type: match[2].trim(),
        position: match.index
      });
    }

    return variables;
  }

  parseSelectionSets(query) {
    const selectionSets = [];
    // Simplified selection set parsing
    const fieldRegex = /(\w+)(\s*\([^)]*\))?\s*{/g;
    let match;

    while ((match = fieldRegex.exec(query)) !== null) {
      selectionSets.push({
        field: match[1],
        arguments: match[2] || '',
        position: match.index
      });
    }

    return selectionSets;
  }

  calculateQueryComplexity(query) {
    // Simplified complexity calculation
    const fieldCount = (query.match(/\w+\s*[({]/g) || []).length;
    const nestedLevels = (query.match(/{/g) || []).length;
    const argumentCount = (query.match(/\([^)]*\)/g) || []).length;

    return fieldCount + (nestedLevels * 2) + (argumentCount * 1.5);
  }

  calculateQueryDepth(query) {
    let depth = 0;
    let currentDepth = 0;

    for (const char of query) {
      if (char === '{') {
        currentDepth++;
        depth = Math.max(depth, currentDepth);
      } else if (char === '}') {
        currentDepth--;
      }
    }

    return depth;
  }

  countFields(query) {
    // Count unique field names
    const fieldMatches = query.match(/\w+(?=\s*[({:])/g) || [];
    const uniqueFields = new Set(fieldMatches.filter(field =>
      !['query', 'mutation', 'subscription', 'fragment', 'on'].includes(field.toLowerCase())
    ));

    return uniqueFields.size;
  }

  estimateQueryCost(analysis) {
    // Estimate query execution cost based on complexity metrics
    const baseCost = 1;
    const complexityCost = analysis.complexity * 0.1;
    const depthCost = analysis.depth * 0.5;
    const fieldCost = analysis.fieldCount * 0.2;

    return baseCost + complexityCost + depthCost + fieldCost;
  }

  identifyOptimizations(query, analysis) {
    const optimizations = [];

    // High complexity warning
    if (analysis.complexity > 50) {
      optimizations.push({
        type: 'high_complexity',
        message: 'Query complexity is high, consider breaking into smaller queries',
        severity: 'medium',
        complexity: analysis.complexity
      });
    }

    // Deep nesting warning
    if (analysis.depth > 10) {
      optimizations.push({
        type: 'deep_nesting',
        message: 'Query has deep nesting, consider using fragments',
        severity: 'medium',
        depth: analysis.depth
      });
    }

    // Too many fields
    if (analysis.fieldCount > 20) {
      optimizations.push({
        type: 'too_many_fields',
        message: 'Query selects many fields, consider field selection optimization',
        severity: 'low',
        fieldCount: analysis.fieldCount
      });
    }

    // Duplicate field selections
    const duplicateFields = this.findDuplicateFields(query);
    if (duplicateFields.length > 0) {
      optimizations.push({
        type: 'duplicate_fields',
        message: 'Query contains duplicate field selections',
        severity: 'medium',
        duplicates: duplicateFields
      });
    }

    // Missing fragments opportunity
    if (this.canUseFragments(query)) {
      optimizations.push({
        type: 'fragment_opportunity',
        message: 'Query could benefit from fragments to reduce duplication',
        severity: 'low'
      });
    }

    // Pagination opportunity
    if (this.needsPagination(query)) {
      optimizations.push({
        type: 'pagination_needed',
        message: 'Large result sets should use pagination',
        severity: 'high'
      });
    }

    return optimizations;
  }

  findDuplicateFields(query) {
    const fields = [];
    const fieldRegex = /(\w+)\s*(?:\([^)]*\))?\s*{/g;
    let match;

    while ((match = fieldRegex.exec(query)) !== null) {
      fields.push(match[1]);
    }

    const duplicates = fields.filter((field, index) =>
      fields.indexOf(field) !== index
    );

    return [...new Set(duplicates)];
  }

  canUseFragments(query) {
    // Check for repeated selection patterns
    const selectionPatterns = query.match(/{[^{}]*}/g) || [];
    const uniquePatterns = new Set(selectionPatterns);

    return selectionPatterns.length > uniquePatterns.size;
  }

  needsPagination(query) {
    // Check for list fields without pagination arguments
    const listFieldPattern = /(\w+)\s*(?:\([^)]*\))?\s*{/g;
    const paginationKeywords = ['first', 'last', 'after', 'before', 'limit', 'offset'];

    return !paginationKeywords.some(keyword =>
      query.toLowerCase().includes(keyword)
    ) && query.includes('[');
  }

  isQueryCacheable(query, analysis) {
    // Mutations are not cacheable
    if (query.toLowerCase().includes('mutation')) {
      return false;
    }

    // Subscriptions are not cacheable
    if (query.toLowerCase().includes('subscription')) {
      return false;
    }

    // Queries with real-time data might not be cacheable
    const realTimeFields = ['now', 'current', 'live', 'real'];
    const hasRealTimeFields = realTimeFields.some(field =>
      query.toLowerCase().includes(field)
    );

    return !hasRealTimeFields;
  }

  calculateCacheTTL(query, analysis) {
    // Default TTL
    let ttl = 300000; // 5 minutes

    // Adjust based on query characteristics
    if (query.includes('user') || query.includes('profile')) {
      ttl = 60000; // 1 minute for user data
    } else if (query.includes('static') || query.includes('config')) {
      ttl = 3600000; // 1 hour for static data
    } else if (analysis.complexity < 10) {
      ttl = 600000; // 10 minutes for simple queries
    }

    return ttl;
  }

  // Query optimization
  optimizeQuery(query, analysis) {
    let optimizedQuery = query;

    // Apply optimizations based on analysis
    for (const optimization of analysis.optimizations) {
      switch (optimization.type) {
        case 'duplicate_fields':
          optimizedQuery = this.removeDuplicateFields(optimizedQuery);
          break;
        case 'fragment_opportunity':
          optimizedQuery = this.addFragments(optimizedQuery);
          break;
        default:
          // Other optimizations would be applied here
          break;
      }
    }

    return optimizedQuery;
  }

  removeDuplicateFields(query) {
    // Simplified duplicate field removal
    // In a real implementation, this would need proper AST parsing
    return query;
  }

  addFragments(query) {
    // Simplified fragment addition
    // In a real implementation, this would analyze repeated patterns
    return query;
  }

  updateRequestWithOptimizedQuery(options, optimizedQuery, variables, operationName) {
    const newOptions = { ...options };

    if (typeof options.body === 'string') {
      const requestData = JSON.parse(options.body);
      requestData.query = optimizedQuery;
      newOptions.body = JSON.stringify(requestData);
    }

    return newOptions;
  }

  // Caching implementation
  getCachedResult(querySignature) {
    if (!this.options.enableCaching) return null;

    const cached = this.queryCache.get(querySignature);
    if (!cached) return null;

    // Check if cache is still valid
    if (Date.now() > cached.expiresAt) {
      this.queryCache.delete(querySignature);
      return null;
    }

    return cached.data;
  }

  cacheResult(querySignature, data, ttl = this.options.cacheTimeout) {
    if (!this.options.enableCaching) return;

    // Implement cache size limit
    if (this.queryCache.size >= this.options.maxCacheSize) {
      this.evictOldestCacheEntry();
    }

    this.queryCache.set(querySignature, {
      data: data,
      cachedAt: Date.now(),
      expiresAt: Date.now() + ttl,
      accessCount: 1,
      lastAccessed: Date.now()
    });

    this.saveData();
  }

  evictOldestCacheEntry() {
    let oldestKey = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.queryCache) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.queryCache.delete(oldestKey);
    }
  }

  createCachedResponse(data) {
    return new Response(JSON.stringify(data), {
      status: 200,
      statusText: 'OK',
      headers: {
        'Content-Type': 'application/json',
        'X-GraphQL-Cache': 'HIT'
      }
    });
  }

  // Batching implementation
  canBatchQuery(query) {
    // Only batch simple queries without mutations
    return !query.toLowerCase().includes('mutation') &&
           !query.toLowerCase().includes('subscription');
  }

  addToBatch(querySignature, url, options, originalFetch, startTime) {
    return new Promise((resolve, reject) => {
      const batchKey = url;

      if (!this.batchRequests.has(batchKey)) {
        this.batchRequests.set(batchKey, {
          requests: [],
          timeout: null
        });
      }

      const batch = this.batchRequests.get(batchKey);
      batch.requests.push({
        querySignature,
        options,
        resolve,
        reject,
        startTime
      });

      // Clear existing timeout
      if (batch.timeout) {
        clearTimeout(batch.timeout);
      }

      // Set new timeout for batch execution
      batch.timeout = setTimeout(() => {
        this.executeBatch(batchKey, url, originalFetch);
      }, this.options.batchWindow);

      // Execute immediately if batch is full
      if (batch.requests.length >= this.options.maxBatchSize) {
        clearTimeout(batch.timeout);
        this.executeBatch(batchKey, url, originalFetch);
      }
    });
  }

  async executeBatch(batchKey, url, originalFetch) {
    const batch = this.batchRequests.get(batchKey);
    if (!batch || batch.requests.length === 0) return;

    this.batchRequests.delete(batchKey);

    try {
      // Create batched query
      const batchedQueries = batch.requests.map((req, index) => {
        const requestData = this.parseGraphQLRequest(req.options);
        return {
          id: index.toString(),
          query: requestData.query,
          variables: requestData.variables,
          operationName: requestData.operationName
        };
      });

      // Execute batched request
      const batchOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(batch.requests[0].options.headers || {})
        },
        body: JSON.stringify(batchedQueries)
      };

      const response = await originalFetch(url, batchOptions);
      const results = await response.json();

      // Resolve individual promises
      batch.requests.forEach((req, index) => {
        const result = Array.isArray(results) ? results[index] : results;
        const individualResponse = new Response(JSON.stringify(result), {
          status: response.status,
          statusText: response.statusText,
          headers: {
            'Content-Type': 'application/json',
            'X-GraphQL-Batched': 'true'
          }
        });

        // Record analytics for batched query
        this.recordQueryAnalytics(req.querySignature, req.startTime, false, 'batched');

        req.resolve(individualResponse);
      });

    } catch (error) {
      // Reject all promises in the batch
      batch.requests.forEach(req => {
        this.recordQueryAnalytics(req.querySignature, req.startTime, false, 'batch_error');
        req.reject(error);
      });
    }
  }

  // Analytics and monitoring
  recordQueryAnalytics(querySignature, startTime, fromCache, source, additionalData = {}) {
    if (!this.options.enableAnalytics) return;

    const endTime = performance.now();
    const duration = endTime - startTime;

    if (!this.queryAnalytics.has(querySignature)) {
      this.queryAnalytics.set(querySignature, {
        executions: 0,
        totalDuration: 0,
        cacheHits: 0,
        errors: 0,
        avgDuration: 0,
        lastExecuted: 0,
        sources: {},
        ...additionalData
      });
    }

    const analytics = this.queryAnalytics.get(querySignature);
    analytics.executions++;
    analytics.totalDuration += duration;
    analytics.avgDuration = analytics.totalDuration / analytics.executions;
    analytics.lastExecuted = Date.now();

    if (fromCache) {
      analytics.cacheHits++;
    }

    if (source === 'error' || source === 'batch_error') {
      analytics.errors++;
    }

    analytics.sources[source] = (analytics.sources[source] || 0) + 1;

    // Merge additional data
    Object.assign(analytics, additionalData);

    this.saveData();
  }

  // Performance monitoring
  startPerformanceMonitoring() {
    // Monitor cache performance
    setInterval(() => {
      this.analyzeCachePerformance();
    }, 60000); // Every minute

    // Monitor query performance
    setInterval(() => {
      this.analyzeQueryPerformance();
    }, 120000); // Every 2 minutes
  }

  analyzeCachePerformance() {
    const totalQueries = Array.from(this.queryAnalytics.values())
      .reduce((sum, analytics) => sum + analytics.executions, 0);

    const cacheHits = Array.from(this.queryAnalytics.values())
      .reduce((sum, analytics) => sum + analytics.cacheHits, 0);

    const cacheHitRate = totalQueries > 0 ? (cacheHits / totalQueries) * 100 : 0;

    console.log(`📊 GraphQL Cache Performance: ${cacheHitRate.toFixed(2)}% hit rate`);

    if (cacheHitRate < 30) {
      console.warn('⚠️ Low cache hit rate, consider adjusting cache strategy');
    }
  }

  analyzeQueryPerformance() {
    const slowQueries = Array.from(this.queryAnalytics.entries())
      .filter(([_, analytics]) => analytics.avgDuration > 1000)
      .sort((a, b) => b[1].avgDuration - a[1].avgDuration)
      .slice(0, 5);

    if (slowQueries.length > 0) {
      console.warn('🐌 Slow GraphQL queries detected:', slowQueries.map(q => ({
        signature: q[0].slice(0, 8),
        avgDuration: Math.round(q[1].avgDuration),
        executions: q[1].executions
      })));
    }
  }

  // Setup XHR interception for legacy support
  interceptXHR() {
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      this._graphqlUrl = url;
      this._graphqlMethod = method;
      return originalOpen.call(this, method, url, ...args);
    };

    XMLHttpRequest.prototype.send = function(data) {
      if (this._graphqlUrl && window.GraphQLOptimizer.isGraphQLRequest(this._graphqlUrl, { body: data })) {
        // Handle GraphQL XHR requests
        console.log('GraphQL XHR request detected:', this._graphqlUrl);
      }
      return originalSend.call(this, data);
    };
  }

  // Public API methods
  getQueryAnalytics() {
    return Object.fromEntries(this.queryAnalytics);
  }

  getCacheStats() {
    return {
      size: this.queryCache.size,
      maxSize: this.options.maxCacheSize,
      hitRate: this.calculateCacheHitRate()
    };
  }

  calculateCacheHitRate() {
    const analytics = Array.from(this.queryAnalytics.values());
    const totalQueries = analytics.reduce((sum, a) => sum + a.executions, 0);
    const cacheHits = analytics.reduce((sum, a) => sum + a.cacheHits, 0);

    return totalQueries > 0 ? (cacheHits / totalQueries) * 100 : 0;
  }

  clearCache() {
    this.queryCache.clear();
    this.saveData();
    console.log('🗑️ GraphQL cache cleared');
  }

  getOptimizationReport() {
    const report = {
      totalQueries: this.queryAnalytics.size,
      cacheHitRate: this.calculateCacheHitRate(),
      slowQueries: [],
      highComplexityQueries: [],
      optimizationOpportunities: []
    };

    // Find slow queries
    for (const [signature, analytics] of this.queryAnalytics) {
      if (analytics.avgDuration > 1000) {
        report.slowQueries.push({
          signature: signature.slice(0, 12),
          avgDuration: Math.round(analytics.avgDuration),
          executions: analytics.executions
        });
      }
    }

    return report;
  }
}

// Initialize GraphQL Optimizer
window.GraphQLOptimizer = new GraphQLOptimizer({
  enableCaching: true,
  enableBatching: true,
  enableAnalytics: true,
  enableOptimization: true,
  cacheTimeout: 5 * 60 * 1000,
  batchWindow: 50,
  maxBatchSize: 10,
  maxCacheSize: 100
});

// Expose utility functions
window.graphqlOptimizer = {
  getAnalytics: () => window.GraphQLOptimizer.getQueryAnalytics(),
  getCacheStats: () => window.GraphQLOptimizer.getCacheStats(),
  clearCache: () => window.GraphQLOptimizer.clearCache(),
  getReport: () => window.GraphQLOptimizer.getOptimizationReport()
};

console.log('🔍 GraphQL Query Optimizer loaded and monitoring');

# Phase 2 Cloudflare Implementation Plan

**Date**: October 20, 2025  
**Version**: 2.0  
**Prerequisites**: Phase 1 complete (KV cache, rate limiting, analytics)

## Phase 2 Features Overview

Building on Phase 1's success, Phase 2 adds three powerful features:

1. **AI Gateway** - Unified AI provider management with fallbacks
2. **D1 Database** - SQL analytics and query history
3. **Edge Prompt Enhancement** - Improve responses at the edge before AutoRAG

### Expected Additional Impact

- **Cost Savings**: Additional $10-15/month (total: $77-82/month saved)
- **Reliability**: 99.9% uptime with automatic fallbacks
- **Insights**: Rich SQL analytics with historical trends
- **Quality**: Better responses through edge-side context injection

---

## Feature 1: AI Gateway Integration

### What is AI Gateway?

Cloudflare AI Gateway provides:
- **Unified API** for multiple AI providers (OpenAI, Anthropic, AutoRAG)
- **Automatic caching** (reduces duplicate requests)
- **Request logging** across all providers
- **Fallback handling** (if one provider fails, try another)
- **Rate limiting** at the gateway level
- **Cost tracking** per provider

### Benefits

- **Reliability**: Automatic failover to backup providers
- **Visibility**: Single dashboard for all AI requests
- **Cost Control**: Track spending per provider
- **Flexibility**: Easy to switch between providers

### Setup Steps

#### 1. Create AI Gateway in Dashboard

```bash
# Option 1: Via Dashboard (Recommended)
# 1. Go to Cloudflare Dashboard → AI → AI Gateway
# 2. Click "Create Gateway"
# 3. Name: "blakeoxford-ai-gateway"
# 4. Copy the gateway ID (e.g., "abc123xyz")

# Option 2: Via API
curl -X POST \
  "https://api.cloudflare.com/client/v4/accounts/cc3bb24ae3c87cff38c2be85df3dab29/ai-gateway/gateways" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "blakeoxford-ai-gateway",
    "cache_ttl": 3600,
    "collect_logs": true,
    "rate_limiting_interval": 60,
    "rate_limiting_limit": 100
  }'
```

#### 2. Update wrangler.toml

Add AI Gateway configuration:

```toml
[vars]
AI_GATEWAY_ID = "blakeoxford-ai-gateway"
AI_GATEWAY_ACCOUNT_ID = "cc3bb24ae3c87cff38c2be85df3dab29"

# Backup provider configuration (optional)
OPENAI_BACKUP_ENABLED = "true"
```

Add secrets (run these commands):

```bash
# Optional: Add OpenAI as backup provider
wrangler secret put OPENAI_API_KEY
# Enter your OpenAI API key when prompted
```

#### 3. Update edge-computing.js

Replace direct AutoRAG calls with AI Gateway proxy:

```javascript
// Before (direct call):
const upstreamResponse = await fetch(env.AI_SEARCH_API_ENDPOINT, {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'authorization': `Bearer ${env.AI_SEARCH_API_TOKEN}`
  },
  body: JSON.stringify(requestBody)
});

// After (via AI Gateway):
const gatewayUrl = `https://gateway.ai.cloudflare.com/v1/${env.AI_GATEWAY_ACCOUNT_ID}/${env.AI_GATEWAY_ID}/autorag`;
const upstreamResponse = await fetch(gatewayUrl, {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'authorization': `Bearer ${env.AI_SEARCH_API_TOKEN}`,
    'cf-aig-cache-ttl': '3600', // 1 hour cache at gateway
    'cf-aig-metadata': JSON.stringify({ 
      user: sessionId, 
      source: 'website-chat' 
    })
  },
  body: JSON.stringify({
    endpoint: env.AI_SEARCH_API_ENDPOINT,
    ...requestBody
  })
});

// Add fallback to OpenAI if AutoRAG fails
if (!upstreamResponse.ok && env.OPENAI_BACKUP_ENABLED === 'true' && env.OPENAI_API_KEY) {
  console.log('AutoRAG failed, falling back to OpenAI GPT-4');
  
  const openaiUrl = `https://gateway.ai.cloudflare.com/v1/${env.AI_GATEWAY_ACCOUNT_ID}/${env.AI_GATEWAY_ID}/openai/chat/completions`;
  upstreamResponse = await fetch(openaiUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'authorization': `Bearer ${env.OPENAI_API_KEY}`,
      'cf-aig-cache-ttl': '3600'
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: 'You are Blake Oxford\'s AI assistant. Answer questions about his skills, projects, and experience.' },
        ...history,
        { role: 'user', content: query }
      ],
      max_tokens: 500,
      temperature: 0.7
    })
  });
}
```

#### 4. Benefits Realized

- ✅ **Automatic caching** at gateway level (additional layer beyond KV)
- ✅ **Unified logging** for all AI requests
- ✅ **Fallback to OpenAI** if AutoRAG is down
- ✅ **Cost tracking** per provider in dashboard
- ✅ **Request metadata** for analytics (user, source, etc.)

---

## Feature 2: D1 Database Integration

### What is D1?

D1 is Cloudflare's serverless SQL database:
- **Global replication** (low latency everywhere)
- **SQLite-compatible** (familiar SQL syntax)
- **Free tier**: 5GB storage, 5M row reads/day
- **Edge-native** (queries run at the edge)

### Benefits

- **Rich Analytics**: SQL queries for complex insights
- **Query History**: Store every AI query for analysis
- **User Preferences**: Remember user settings
- **Trend Analysis**: Track popular queries over time
- **Advanced Reporting**: Weekly/monthly usage summaries

### Setup Steps

#### 1. Create D1 Database

```bash
# Create the database
wrangler d1 create blakeoxford-ai-analytics

# Output will show:
# ✅ Successfully created DB 'blakeoxford-ai-analytics'
# Created your database using D1's new storage backend.
# [[d1_databases]]
# binding = "DB"
# database_name = "blakeoxford-ai-analytics"
# database_id = "abc123xyz"
```

#### 2. Update wrangler.toml

```toml
[[d1_databases]]
binding = "DB"
database_name = "blakeoxford-ai-analytics"
database_id = "<database_id_from_previous_step>"
```

#### 3. Create Database Schema

Create file: `migrations/0001_initial_schema.sql`

```sql
-- Query history table
CREATE TABLE IF NOT EXISTS ai_queries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query_text TEXT NOT NULL,
  normalized_query TEXT NOT NULL, -- For grouping similar queries
  response_text TEXT,
  sources_count INTEGER DEFAULT 0,
  response_time_ms INTEGER,
  cache_hit BOOLEAN DEFAULT FALSE,
  client_ip TEXT,
  session_id TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User feedback table
CREATE TABLE IF NOT EXISTS user_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query_id INTEGER REFERENCES ai_queries(id),
  rating INTEGER CHECK(rating >= 1 AND rating <= 5),
  comment TEXT,
  helpful BOOLEAN,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Query patterns table (for optimization)
CREATE TABLE IF NOT EXISTS query_patterns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pattern TEXT UNIQUE NOT NULL,
  count INTEGER DEFAULT 1,
  avg_response_time_ms INTEGER,
  cache_hit_rate REAL,
  last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  session_id TEXT PRIMARY KEY,
  preferred_response_style TEXT, -- 'concise', 'detailed', 'technical'
  enable_voice BOOLEAN DEFAULT FALSE,
  enable_memory BOOLEAN DEFAULT TRUE,
  theme TEXT DEFAULT 'auto',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_queries_created_at ON ai_queries(created_at);
CREATE INDEX IF NOT EXISTS idx_queries_normalized ON ai_queries(normalized_query);
CREATE INDEX IF NOT EXISTS idx_queries_session ON ai_queries(session_id);
CREATE INDEX IF NOT EXISTS idx_feedback_query ON user_feedback(query_id);
CREATE INDEX IF NOT EXISTS idx_patterns_last_seen ON query_patterns(last_seen);
```

#### 4. Run Migration

```bash
# Apply the schema
wrangler d1 execute blakeoxford-ai-analytics --file=migrations/0001_initial_schema.sql

# Verify tables created
wrangler d1 execute blakeoxford-ai-analytics --command="SELECT name FROM sqlite_master WHERE type='table';"
```

#### 5. Update edge-computing.js to Use D1

Add query logging:

```javascript
// After successful AI response
if (env.DB) {
  try {
    // Insert query into database
    const stmt = env.DB.prepare(`
      INSERT INTO ai_queries (
        query_text, normalized_query, response_text, 
        sources_count, response_time_ms, cache_hit,
        client_ip, session_id, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    await stmt.bind(
      query,
      normalizeForCache(query),
      message,
      sources.length,
      Date.now() - startTime,
      cacheHit ? 1 : 0,
      clientIp,
      sessionId || 'anonymous',
      request.headers.get('user-agent') || 'unknown'
    ).run();

    // Update query patterns
    await env.DB.prepare(`
      INSERT INTO query_patterns (pattern, count, avg_response_time_ms, cache_hit_rate)
      VALUES (?, 1, ?, ?)
      ON CONFLICT(pattern) DO UPDATE SET
        count = count + 1,
        avg_response_time_ms = (avg_response_time_ms * count + ?) / (count + 1),
        cache_hit_rate = (cache_hit_rate * count + ?) / (count + 1),
        last_seen = CURRENT_TIMESTAMP
    `).bind(
      normalizeForCache(query),
      Date.now() - startTime,
      cacheHit ? 1 : 0,
      Date.now() - startTime,
      cacheHit ? 1 : 0
    ).run();
  } catch (err) {
    // Don't fail the request if logging fails
    console.error('Failed to log to D1:', err);
  }
}
```

#### 6. Create Analytics API Endpoint

Add new endpoint: `/api/ai-analytics`

```javascript
if (url.pathname === '/api/ai-analytics') {
  // Only allow authenticated requests
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !env.ANALYTICS_SECRET || authHeader !== `Bearer ${env.ANALYTICS_SECRET}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401,
      headers: { 'content-type': 'application/json' }
    });
  }

  const { period = '7d', limit = 100 } = await request.json();
  
  // Popular queries
  const popularQueries = await env.DB.prepare(`
    SELECT 
      normalized_query,
      COUNT(*) as count,
      AVG(response_time_ms) as avg_time,
      SUM(CASE WHEN cache_hit = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as cache_hit_rate
    FROM ai_queries
    WHERE created_at > datetime('now', '-${period}')
    GROUP BY normalized_query
    ORDER BY count DESC
    LIMIT ?
  `).bind(limit).all();

  // Daily trends
  const dailyTrends = await env.DB.prepare(`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as total_queries,
      AVG(response_time_ms) as avg_response_time,
      SUM(CASE WHEN cache_hit = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as cache_hit_rate
    FROM ai_queries
    WHERE created_at > datetime('now', '-${period}')
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `).all();

  // Feedback summary
  const feedbackSummary = await env.DB.prepare(`
    SELECT 
      AVG(rating) as avg_rating,
      COUNT(*) as total_feedback,
      SUM(CASE WHEN helpful = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as helpful_rate
    FROM user_feedback
    WHERE created_at > datetime('now', '-${period}')
  `).first();

  return new Response(JSON.stringify({
    popularQueries: popularQueries.results,
    dailyTrends: dailyTrends.results,
    feedbackSummary
  }), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });
}
```

Set the analytics secret:

```bash
wrangler secret put ANALYTICS_SECRET
# Enter a strong random string
```

---

## Feature 3: Edge-Side Prompt Enhancement

### What is Edge Prompt Enhancement?

Process and enhance user queries at the edge before sending to AutoRAG:
- **Context injection** based on query type
- **Query reformulation** for better results
- **Pre-filtering** to reduce AutoRAG load
- **Smart routing** (simple queries use cache, complex use AutoRAG)

### Benefits

- **Better Responses**: More relevant and detailed answers
- **Cost Savings**: Simple queries answered from cache
- **Faster**: Less processing needed by AutoRAG
- **Smarter**: Context-aware query enhancement

### Implementation

Add to edge-computing.js before AutoRAG call:

```javascript
// Edge-side prompt enhancement
function enhanceQueryAtEdge(query, history, sessionPrefs) {
  const enhanced = { query, shouldUseCache: true, complexity: 'simple' };
  
  // Detect query type and add context
  const lowerQuery = query.toLowerCase();
  
  // Skill/expertise queries
  if (lowerQuery.match(/skill|proficien|expert|experience|knowledge/)) {
    enhanced.query = `${query}\n\nContext: Focus on specific technical skills, years of experience, and concrete examples of using these skills in real projects.`;
    enhanced.complexity = 'medium';
  }
  
  // Project queries
  else if (lowerQuery.match(/project|built|created|developed|implemented/)) {
    enhanced.query = `${query}\n\nContext: Provide specific project details including technologies used, impact/results, challenges overcome, and measurable outcomes.`;
    enhanced.complexity = 'medium';
  }
  
  // Comparison queries
  else if (lowerQuery.match(/compare|versus|vs|difference|better/)) {
    enhanced.query = `${query}\n\nContext: Compare approaches used in different projects, explain tradeoffs, and provide specific examples.`;
    enhanced.complexity = 'complex';
  }
  
  // How-to queries
  else if (lowerQuery.match(/how|guide|tutorial|steps|process/)) {
    enhanced.query = `${query}\n\nContext: Provide step-by-step explanations based on actual implementation experience, including best practices and pitfalls to avoid.`;
    enhanced.complexity = 'complex';
  }
  
  // Time-sensitive queries (bypass cache)
  else if (lowerQuery.match(/latest|recent|current|now|today/)) {
    enhanced.shouldUseCache = false;
    enhanced.complexity = 'simple';
  }
  
  // Apply user preferences
  if (sessionPrefs?.preferred_response_style === 'concise') {
    enhanced.query += '\n\nResponse style: Concise and to-the-point, 2-3 sentences maximum.';
  } else if (sessionPrefs?.preferred_response_style === 'technical') {
    enhanced.query += '\n\nResponse style: Technical and detailed, include specific technologies and implementation details.';
  }
  
  // For follow-up questions, add conversation context
  if (history.length > 0) {
    const lastUserMsg = history.filter(h => h.role === 'user').slice(-1)[0];
    if (lastUserMsg && query.length < 30) {
      // Short query likely a follow-up
      enhanced.query = `Follow-up to previous question about "${lastUserMsg.content.slice(0, 100)}": ${query}`;
    }
  }
  
  return enhanced;
}

// Use in /api/ai-search handler
const { query: enhancedQuery, shouldUseCache, complexity } = enhanceQueryAtEdge(
  query,
  history,
  sessionPreferences // fetched from D1 if available
);

// Update cacheEnabled based on enhancement
const cacheEnabled = shouldUseCache && !enhancedQuery.toLowerCase().includes('latest');

// Log complexity for analytics
if (env.AI_ANALYTICS) {
  // Add complexity as metadata
  analyticsData.complexity = complexity;
}
```

### Advanced: Smart Query Routing

Route simple queries to faster paths:

```javascript
// Smart routing based on complexity
async function routeQuery(query, complexity, env) {
  // Very simple queries: check FAQ cache first
  if (complexity === 'simple' && query.length < 50) {
    const faq = await checkFAQ(query, env.AI_RESPONSE_CACHE);
    if (faq) return faq;
  }
  
  // Medium queries: use KV cache -> AutoRAG
  if (complexity === 'medium') {
    const cached = await checkKVCache(query, env.AI_RESPONSE_CACHE);
    if (cached) return cached;
    
    return await callAutoRAG(query, env);
  }
  
  // Complex queries: bypass cache, go straight to AutoRAG
  if (complexity === 'complex') {
    return await callAutoRAG(query, env);
  }
}
```

---

## Implementation Checklist

### Phase 2A: AI Gateway (30 min)

- [ ] Create AI Gateway in Cloudflare dashboard
- [ ] Update wrangler.toml with gateway config
- [ ] Modify edge-computing.js to use gateway
- [ ] Add OpenAI fallback (optional)
- [ ] Deploy and test
- [ ] Verify gateway dashboard shows requests

### Phase 2B: D1 Database (45 min)

- [ ] Create D1 database with wrangler
- [ ] Update wrangler.toml with D1 binding
- [ ] Create and run schema migration
- [ ] Add query logging to edge-computing.js
- [ ] Create analytics API endpoint
- [ ] Set ANALYTICS_SECRET
- [ ] Deploy and test
- [ ] Verify data in D1

### Phase 2C: Edge Prompt Enhancement (20 min)

- [ ] Add enhanceQueryAtEdge function
- [ ] Integrate with AI search handler
- [ ] Add complexity-based routing
- [ ] Test with various query types
- [ ] Monitor response quality improvement

### Total Time: ~2 hours

---

## Expected Results After Phase 2

### Cost Analysis

**Before Phase 1**: $106/month  
**After Phase 1**: $39/month (63% savings)  
**After Phase 2**: $24-29/month (77% savings)

**Breakdown**:
- AutoRAG: $25/month (was $106, reduced by gateway caching + edge filtering)
- AI Gateway: $0 (free tier covers usage)
- D1 Database: $0 (free tier covers 5M reads/day)
- KV Storage: $4/month (same as Phase 1)

**Total Savings**: $77-82/month

### Performance Improvements

- **Response Time**: 
  - Cache hits: <5ms (Phase 1)
  - Simple queries: 50-100ms (Phase 2 edge enhancement)
  - Complex queries: 500-800ms (Phase 2 AI Gateway routing)
  
- **Reliability**: 99.9% uptime with AI Gateway fallbacks

- **Quality**: 25-30% improvement in response relevance (edge enhancement)

### Analytics Capabilities

With D1, you can now answer:
- "What are the top 10 most asked questions this month?"
- "What's the average response time trend over the last 30 days?"
- "Which queries have the highest user satisfaction?"
- "What percentage of queries are cache hits vs API calls?"

---

## Testing Phase 2

### Test AI Gateway

```bash
# Make a request and check gateway logs
curl -X POST https://blakeoxford.com/api/ai-search \
  -H "Content-Type: application/json" \
  -d '{"query": "What are your skills"}' -v

# Check Cloudflare Dashboard → AI → AI Gateway
# You should see the request logged with metadata
```

### Test D1 Analytics

```bash
# Query popular searches
wrangler d1 execute blakeoxford-ai-analytics --command="
  SELECT normalized_query, COUNT(*) as count 
  FROM ai_queries 
  GROUP BY normalized_query 
  ORDER BY count DESC 
  LIMIT 10;
"

# Check daily trends
wrangler d1 execute blakeoxford-ai-analytics --command="
  SELECT DATE(created_at) as date, COUNT(*) as queries
  FROM ai_queries 
  GROUP BY DATE(created_at) 
  ORDER BY date DESC 
  LIMIT 7;
"
```

### Test Edge Enhancement

```bash
# Simple query (should be fast)
time curl -X POST https://blakeoxford.com/api/ai-search \
  -H "Content-Type: application/json" \
  -d '{"query": "hi"}' | jq '.message'

# Complex query (will use full AutoRAG)
time curl -X POST https://blakeoxford.com/api/ai-search \
  -H "Content-Type: application/json" \
  -d '{"query": "Compare your experience with Python vs JavaScript for data processing"}' | jq '.message'
```

---

## Monitoring Dashboard

Create a simple analytics dashboard by querying D1:

```sql
-- Weekly Summary Report
SELECT 
  'This Week' as period,
  COUNT(*) as total_queries,
  ROUND(AVG(response_time_ms), 0) as avg_response_time_ms,
  ROUND(SUM(CASE WHEN cache_hit = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as cache_hit_rate,
  COUNT(DISTINCT session_id) as unique_users
FROM ai_queries
WHERE created_at > datetime('now', '-7 days')

UNION ALL

SELECT 
  'Last Week',
  COUNT(*),
  ROUND(AVG(response_time_ms), 0),
  ROUND(SUM(CASE WHEN cache_hit = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1),
  COUNT(DISTINCT session_id)
FROM ai_queries
WHERE created_at BETWEEN datetime('now', '-14 days') AND datetime('now', '-7 days');
```

---

## Next Steps: Phase 3 (Future)

After Phase 2 stabilizes, consider:

1. **Durable Objects** - Stateful chat sessions with memory
2. **Vectorize** - Semantic search across all content
3. **Workers AI** - Run small models at the edge for instant responses
4. **Queues** - Async processing for complex queries

**Estimated Additional Savings**: $5-10/month  
**Total Potential Savings**: $87-92/month (82-87% reduction)

---

## Rollback Plan

If Phase 2 causes issues:

```bash
# Remove AI Gateway
# Simply comment out gateway code, revert to direct calls

# Remove D1 queries
# Comment out D1 logging code (non-breaking)

# Remove edge enhancement
# Comment out enhanceQueryAtEdge function

# Redeploy
wrangler deploy
```

Phase 2 changes are non-breaking - your site will work even if features fail.

---

**Ready to implement Phase 2?** Start with Phase 2A (AI Gateway) for immediate reliability improvements.
